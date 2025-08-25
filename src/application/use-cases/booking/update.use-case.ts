import { BOOKING_REPOSITORY, SERVICE_REPOSITORY, USER_REPOSITORY } from '@/application/providers';
import { BookingRescheduledEvent } from '@/domain/common/booking.events';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/ReminderConstants';
import { Reminder } from '@/domain/entities/reminder.entity';
import { Service } from '@/domain/entities/service.entity';
import { User } from '@/domain/entities/user.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
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

     // Se valida que sea reagendable)
    if(!booking.canBeRescheduled()){
      throw new HttpException(
        'Esta reserva no se puede reagendar',
        HttpStatus.BAD_REQUEST,
      );
    }

    //* 2) Definir siguiente servicio y usuario (En caso de ser diferentes al actual)
    let nextService: Service;
    if (newData.serviceId !== undefined && newData.serviceId !== booking.serviceId) {
      const res = await this.serviceRepository.findService({ serviceId: newData.serviceId, commerceId: newData.commerceId });
      if (!res) {
        throw new HttpException(
          'El servicio no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextService = res;
    } else {
      const res = await this.serviceRepository.findService({ serviceId: booking.serviceId, commerceId: booking.commerceId });
      if (!res) {
        throw new HttpException(
          'El servicio no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextService = res;
    }

    let nextUser: User;
    if (newData.userId !== undefined && newData.userId !== booking.userId) {
      const res = await this.userRepository.findUserByCommerce({ userId: newData.userId, commerceId: newData.commerceId });
      if (!res) {
        throw new HttpException(
          'El usuario no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextUser = res;
    } else {
      const res = await this.userRepository.findUserByCommerce({ userId: booking.userId, commerceId: booking.commerceId });
      if (!res) {
        throw new HttpException(
          'El usuario no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextUser = res;
    }

    //* 3) Determinar fecha y hora a usar
    const nextTimeStart = newData.timeStart ? ensureNotPast(newData.timeStart) : booking.timeStart;

    //* 4) Calcular timeEnd según duración del servicio final
    const nextTimeEnd = addMinutesToTime(nextTimeStart, nextService.durationMinutes);

    //* 5) Chequeo de solapamiento (si cambió fecha, hora o servicio)
    if (nextTimeStart != booking.timeStart || nextService.id != booking.serviceId) {
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

    //* 6) Construir diff (solo campos que realmente cambian)
    const dataToUpdate: BookingUpdateData = {};

    dataToUpdate.serviceId = nextService.id;

    dataToUpdate.userId = nextUser.id;

    dataToUpdate.timeStart = nextTimeStart;

    dataToUpdate.timeEnd = nextTimeEnd;

    if (newData.notes !== undefined && newData.notes !== booking.notes) {
      dataToUpdate.notes = newData.notes;
    }

    //* 7) Si no hay cambios reales, devolver sin tocar
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        message: 'Sin cambios',
        statusCode: HttpStatus.OK,
        data: booking,
      };
    }

    //* 8) Persistencia + efectos laterales
    // TODO: idealmente envolver update + log + reminder en una transacción si comparten DB.
    const result = await this.bookingRepository.updateSchedule({ id, dataToUpdate });
    if (result === null) {
      throw new HttpException(
        'Error al actualizar la reserva, intenta de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* 9 Crear el activity log
    const updatedFields = Object.keys(dataToUpdate).join(', ');
    await this.activityLogService.updated({
      entityType: EntityType.BOOKING,
      entityId: result.id,
      userId: result.userId,
      commerceId: result.commerceId,
      customerId: result.customerId,
      detail: `Se actualizaron los campos: ${updatedFields}.`,
    });

    //* 10 Crear el reminder
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

    //* 10) Emitir evento si hubo cambio
    if (
      dataToUpdate.timeStart !== undefined ||
      dataToUpdate.serviceId !== undefined ||
      dataToUpdate.userId !== undefined ||
      dataToUpdate.notes !== undefined ||
      dataToUpdate.timeEnd !== undefined
    ) {
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
