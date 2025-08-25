import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { UpdateBookingDto } from '@/interfaces/controllers/booking/dto/update-booking.dto';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { BOOKING_REPOSITORY, SERVICE_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingRescheduledEvent } from '@/domain/common/booking.events';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/ReminderConstants';
import { Reminder } from '@/domain/entities/reminder.entity';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { addMinutesToTime, ensureNotPast } from '@/domain/value-objects/booking/validations';
import { Service } from '@/domain/entities/service.entity';

@Injectable()
export class UpdateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

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
      booking.customerId !== newData.customerId ||  // Se valida que el usuario que pide, sea el mismo que realizo la reserva
      !booking.canBeRescheduled() // Se valida que sea reagendable
    ) {
      throw new HttpException(
        'No autorizado o reserva no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }


    //* 2) Definir siguiente servicio (En caso de ser diferente al actual)
    let nextService: Service;
    if (newData.serviceId !== undefined && newData.serviceId !== booking.serviceId) {
      const svc = await this.serviceRepository.findService({ serviceId: newData.serviceId, commerceId: newData.commerceId });
      if (!svc) {
        throw new HttpException(
          'El servicio no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextService = svc;
    } else {
      const svc = await this.serviceRepository.findService({ serviceId: booking.serviceId, commerceId: newData.commerceId });
      if (!svc) {
        throw new HttpException(
          'El servicio no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }
      nextService = svc;
    }

    //* 3) Determinar fecha y hora a usar
    const nextDate = newData.date ? ensureNotPast(newData.date) : booking.date;

    //* 4) Calcular timeEnd según duración del servicio final
    const nextTimeEnd = addMinutesToTime(nextDate, nextService.durationMinutes);

    //* 5) Chequeo de solapamiento (si cambió fecha, hora o servicio)
    if (nextDate != booking.date || nextService.id != booking.serviceId) {
      const overlapping = await this.bookingRepository.findOverlapping({
        id, // id de la reserva actual para excluirla si es necesario
        commerceId: newData.commerceId,
        date: nextDate,
        endTime: nextTimeEnd,
      });

      if (overlapping) {
        throw new HttpException('El horario está ocupado', HttpStatus.CONFLICT);
      }
    }

    //* 6) Construir diff (solo campos que realmente cambian)
    const dataToUpdate: BookingUpdateData = {};

    dataToUpdate.serviceId = nextService.id;

    dataToUpdate.date = nextDate;

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
      userId: null,
      commerceId: result.commerceId,
      customerId: result.customerId,
      detail: `Se actualizaron los campos: ${updatedFields}.`,
    });

    //* 10 Crear el reminder
    const reminder = Reminder.update({
      bookingId: result.id,
      customerId: result.customerId,
      commerceId: result.commerceId,
      scheduledAt: nextDate,
      sentAt: null,
      channel: ReminderChannel.email,
      status: ReminderStatus.pending,
    });
    await this.remindersService.updateReminder(reminder);

    //* 10) Emitir evento si hubo cambio de horario (date/time/service -> afecta duración/fin)
    if (
      dataToUpdate.date !== undefined ||
      dataToUpdate.serviceId !== undefined ||
      dataToUpdate.timeEnd !== undefined
    ) {
      this.eventEmitter.emit(
        BOOKING_EVENTS.RESCHEDULED,
        new BookingRescheduledEvent(result, nextDate),
      );
    }

    return {
      message: 'Reserva actualizada exitosamente',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
