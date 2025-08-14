import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { CreateBookingDto } from '@/interfaces/controllers/booking/dto/create-booking.dto';
import { Booking } from '@/domain/entities/booking.entity';
import {
  ACTIVITY_LOG_REPOSITORY,
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class CreateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogRepository: IActivityLogRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(data: CreateBookingDto) {
    try {
      // Validar datos usando Value Objects (incluye todas las validaciones)
      const bookingDate = new BookingDate(data.date);

      // Service existence validation
      const service = await this.serviceRepository.findService({
        serviceId: data.serviceId,
        commerceId: data.commerceId,
      });

      if (!service) {
        throw new HttpException(
          'El servicio no existe o no pertenece al comercio especificado',
          HttpStatus.NOT_FOUND,
        );
      }

      // Schedule available validation
      const startTime = new BookingTime(data.timeStart);
      const endTime = new BookingTime(
        new Date(data.timeStart.getTime() + data.duration * 60 * 1000),
      );
      const overlappingBookings = await this.bookingRepository.findOverlapping({
        startTime: startTime.value,
        endTime: endTime.value,
        date: bookingDate.value,
        commerceId: data.commerceId,
      });

      if (overlappingBookings != null && overlappingBookings) {
        return {
          message: 'El horario está ocupado',
          statusCode: HttpStatus.CONFLICT,
        };
      }

      // Booking creation using domain entity
      const booking = Booking.createPending(
        data.customerId,
        data.serviceId,
        data.commerceId,
        bookingDate.value,
        startTime.value,
        data.duration,
        data.notes,
      );

      const result = await this.bookingRepository.createSchedule({
        customerId: booking.customerId,
        serviceId: booking.serviceId,
        commerceId: booking.commerceId,
        date: booking.date.value,
        timeStart: booking.timeStart.value,
        duration: booking.duration,
        notes: booking.notes,
      });

      if (result === null) {
        throw new HttpException(
          'Error al registrar el turno, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Activity register
      await this.activityLogRepository.create({
        entityTypeId: 1, //Booking
        entityId: result.id,
        changeTypeId: 1, //Created
        detail: 'Booking created',
        userId: null,
        commerceId: result.commerceId,
        customerId: result.customerId,
      });

      //TODO At this point we send notifications to the owner and verification to the client (depending on commerce config)

      return {
        message: 'Su reserva ha sido agendada con éxito.',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar el horario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
