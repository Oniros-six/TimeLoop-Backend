import { BOOKING_HISTORY_REPOSITORY, BOOKING_REPOSITORY, SERVICE_REPOSITORY, USER_REPOSITORY } from '@/application/providers';
import { BookingRescheduledEvent } from '@/domain/common/booking.events';
import { BookingHistoryUpdateData } from '@/domain/common/BookingHistoryUpdateData';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/ReminderConstants';
import { BookingService } from '@/domain/entities/bookingService.entity';
import { Reminder } from '@/domain/entities/reminder.entity';
import { Service } from '@/domain/entities/service.entity';
import { User } from '@/domain/entities/user.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { addMinutesToTime, ensureNotPast } from '@/domain/value-objects/booking/validations';
import { UpdateBookingDto } from '@/interfaces/controllers/booking/dto/update-booking.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UpdateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BOOKING_HISTORY_REPOSITORY)
    private readonly bookingHistoryRepository: IBookingHistoryRepository,

    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
    private readonly remindersService: RemindersService,
  ) { }

  async execute(id: number, newData: UpdateBookingDto) {

    //* 1) Cargar booking y autorizar
    const booking = await this.bookingRepository.findOne({ id });
    if (
      !booking || // Se valida que exista
      booking.commerceId !== newData.commerceId || // Se valida que el comercio sea el mismo donde se realizo la reserva
      booking.customerId !== newData.customerId  // Se valida que el usuario que pide, sea el mismo que realizo la reserva
    ) {
      throw new HttpException(
        'No autorizado o reserva no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    // Se valida que sea reagendable
    if (!booking.canBeRescheduled()) {
      throw new HttpException(
        'Esta reserva no se puede reagendar',
        HttpStatus.BAD_REQUEST,
      );
    }

    //* 2) Determinar que servicios se utilizaran
    let nextServices: Service[];

    if (newData.serviceIds !== undefined) {
      // Buscamos solo los nuevos IDs
      const services = await this.serviceRepository.findServices({
        serviceIds: newData.serviceIds,
        commerceId: newData.commerceId,
      });

      if (services.length !== newData.serviceIds.length) {
        throw new HttpException(
          'Al menos uno de los servicios no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }

      nextServices = services;
    } else {
      // Mantenemos los servicios actuales del booking
      const currentServiceIds = booking.bookingServices.map(bs => bs.serviceId);
      const services = await this.serviceRepository.findServices({
        serviceIds: currentServiceIds,
        commerceId: booking.commerceId,
      });

      nextServices = services;
    }


    //* 3) Definir el nuevo usuario (o dejar el que ya estaba)
    const userIdToCheck = newData.userId ?? booking.userId;
    const nextUser = await this.userRepository.findUserByCommerce({
      userId: userIdToCheck,
      commerceId: newData.commerceId,
    });
    if (!nextUser) throw new HttpException('El usuario no existe o no pertenece al comercio', HttpStatus.NOT_FOUND);


    //* 4) Determinar fecha y hora de inicio y fin
    const nextTimeStart = newData.timeStart ? ensureNotPast(newData.timeStart) : booking.timeStart;

    const totalDuration = booking.calcServicesDuration(nextServices)
    const totalPrice = booking.calcTotalPrice(nextServices)
    const nextTimeEnd = addMinutesToTime(nextTimeStart, totalDuration);

    //* 5) Construir diff (solo campos que realmente cambian)
    const dataToUpdate: BookingUpdateData = {
      serviceIds: nextServices.map(service =>
        new BookingService(booking.id, service.id)
      ),
      totalPrice: totalPrice,
      duration: totalDuration,
      userId: nextUser.id,
      timeStart: nextTimeStart,
      timeEnd: nextTimeEnd,
    };


    if (newData.notes !== undefined && newData.notes !== booking.notes) {
      dataToUpdate.notes = newData.notes;
    }

    //* 6) Si no hay cambios reales, devolver sin tocar
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        message: 'Sin cambios',
        statusCode: HttpStatus.OK,
        data: booking,
      };
    }

    //* 7) Chequeo de solapamiento (si cambió fecha, hora o servicio)
    if (nextTimeStart.getTime() !== booking.timeStart.getTime() ||
      nextTimeEnd.getTime() !== booking.timeEnd.getTime()) {
      const overlapping = await this.bookingRepository.findOverlapping({
        id, // id de la reserva actual para excluirla si es necesario
        commerceId: newData.commerceId,
        timeStart: nextTimeStart,
        timeEnd: nextTimeEnd,
      });

      if (overlapping) {
        throw new HttpException('El horario está ocupado', HttpStatus.CONFLICT);
      }
    }

    //* 8) Persistencia + efectos laterales
    const result = await this.bookingRepository.updateSchedule({ id, dataToUpdate });
    if (result === null) {
      throw new HttpException(
        'Error al actualizar la reserva, intenta de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* 9) Generar historial
    const history: BookingHistoryUpdateData = {
      timeStart: result.timeStart,
      timeEnd: result.timeEnd,
      priceAtBooking: result.totalPrice,
      durationAtBooking: result.duration,
      userId: result.userId,
      notes: result.notes,
    }

    await this.bookingHistoryRepository.update({ id: result.id, history: history })


    //* 10) Crear el activity log
    const updatedFields = Object.keys(dataToUpdate).join(', ');
    await this.activityLogService.updated({
      entityType: EntityType.BOOKING,
      entityId: result.id,
      userId: result.userId,
      commerceId: result.commerceId,
      customerId: result.customerId,
      detail: `Se actualizaron los campos: ${updatedFields}.`,
    });

    //* 11) Crear el reminder
    const reminder = Reminder.update({
      bookingId: result.id,
      customerId: result.customerId,
      commerceId: result.commerceId,
      scheduledAt: nextTimeStart,
      sentAt: null,
      channel: ReminderChannel.email,
      status: ReminderStatus.pending,
    });
    await this.remindersService.updateReminder(reminder);

    //* 12) Emitir evento si hubo cambio
    if (Object.keys(dataToUpdate).length > 0) {
      this.eventEmitter.emit(
        BOOKING_EVENTS.RESCHEDULED,
        new BookingRescheduledEvent(result, nextTimeStart),
      );
    }

    return {
      message: 'Reserva actualizada exitosamente',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
