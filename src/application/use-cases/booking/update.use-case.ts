import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { UpdateBookingDto } from '@/interfaces/controllers/booking/dto/update-booking.dto';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { BOOKING_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingRescheduledEvent } from '@/domain/common/booking.events';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { ReminderChannel, ReminderStatus } from '@/domain/common/ReminderConstants';
import { Reminder } from '@/domain/entities/reminder.entity';

@Injectable()
export class UpdateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
    private readonly remindersService: RemindersService,
  ) { }

  async execute(id: number, newData: UpdateBookingDto) {
    const { commerceId, customerId, date, timeStart, serviceId, notes } =
      newData;

    const booking = await this.bookingRepository.findOne({ id: id });

    if (
      !booking ||
      booking.commerceId !== commerceId ||
      booking.customerId !== customerId
    ) {
      throw new HttpException(
        'No autorizado o reserva no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const dataToUpdate: BookingUpdateData = {};
    let isRescheduled = false;
    let newBookingDate: Date | undefined;
    let newBookingTime: Date | undefined;

    // Use Value Object to validate the date, if one is provided
    if (date) {
      try {
        const bookingDate = new BookingDate(date);
        newBookingDate = bookingDate.value;
        dataToUpdate.date = newBookingDate;
        isRescheduled = true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        console.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
    }

    // Validate time slot using a Value Object if present
    if (timeStart) {
      try {
        const bookingTime = new BookingTime(timeStart);
        newBookingTime = bookingTime.value;
        dataToUpdate.timeStart = newBookingTime
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        console.error(message);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
    }

    if (serviceId) dataToUpdate.serviceId = serviceId;
    if (notes !== undefined) dataToUpdate.notes = notes;

    // If there's nothing to update
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        message: 'Reserva actualizada con exito',
        statusCode: HttpStatus.OK,
        data: booking,
      };
    }

    try {
      const result = await this.bookingRepository.updateSchedule({
        id: id,
        dataToUpdate,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar la reserva, intenta de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const updatedFields = Object.keys(dataToUpdate).join(', ');
      // Activity register
      await this.activityLogService.updated({
        entityTypeId: ENTITY_TYPES.BOOKING,
        entityId: result.id,
        userId: null,
        commerceId: result.commerceId,
        customerId: result.customerId,
        detail: `Se actualizaron los campos: ${updatedFields}.`,
      });

      let schedule: Date;
      // Old value in case of not being modificated
      schedule = new Date(booking.date.value.getTime() + booking.timeStart.value.getTime())
      // Reminder creation
      if (isRescheduled && (newBookingDate || newBookingTime)) {
        if (newBookingDate && newBookingTime) {
          // New full date in case of modification
          schedule = new Date(newBookingDate.getTime() + newBookingTime.getTime());
        }
        if (newBookingDate) {
          // New date in case of modification with old time
          schedule = new Date(newBookingDate.getTime() + booking.timeStart.value.getTime());
        }
        if (newBookingTime) {
          // New time in case of modification with old date
          schedule = new Date(booking.date.value.getTime() + newBookingTime.getTime());
        }
      }

      //TODO en un futuro agregar un parametro extra, para definir en este momento como pretende recibir el recordatorio el cliente
      const reminder = Reminder.update({
        bookingId: result.id,
        customerId: result.customerId,
        commerceId: result.commerceId,
        scheduledAt: schedule,
        sentAt: null,
        channel: ReminderChannel.email,
        status: ReminderStatus.pending,
      });

      await this.remindersService.updateReminder(reminder);

      // Si la reserva fue reprogramada, emitir evento
      if (isRescheduled && newBookingDate) {
        this.eventEmitter.emit(
          BOOKING_EVENTS.RESCHEDULED,
          new BookingRescheduledEvent(result, newBookingDate),
        );
      }

      return {
        message: 'Reserva actualizada exitosamente',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar la reserva, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
