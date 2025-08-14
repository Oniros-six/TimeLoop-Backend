import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { UpdateBookingDto } from '@/interfaces/controllers/booking/dto/update-booking.dto';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import {
  BOOKING_REPOSITORY,
  ACTIVITY_LOG_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class UpdateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogRepository: IActivityLogRepository,
  ) {}

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

    // Use Value Object to validate the date, if one is provided
    if (date) {
      try {
        const bookingDate = new BookingDate(date);
        dataToUpdate.date = bookingDate.value;
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
        dataToUpdate.timeStart = bookingTime.value;
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

      // Activity register
      await this.activityLogRepository.create({
        entityTypeId: 1, // Booking
        entityId: result.id,
        changeTypeId: 2, // Updated
        detail: 'Booking rescheduled',
        userId: null,
        commerceId: result.commerceId,
        customerId: result.customerId,
      });

      //TODO At this point we send notifications to the owner and verification to the customer (depending on commerce config)

      return {
        message: 'Reserva actualizada con exito',
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
