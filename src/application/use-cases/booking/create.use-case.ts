import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { CreateBookingDto } from '@/interfaces/controllers/booking/dto/create-booking.dto';
import { Booking } from '@/domain/entities/booking.entity';
import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';

@Injectable()
export class CreateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    private readonly activityLogService: ActivityLogService,

    private eventEmitter: EventEmitter2,
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
      await this.activityLogService.created({
        entityTypeId: ENTITY_TYPES.BOOKING,
        entityId: result.id,
        userId: null,
        commerceId: result.commerceId,
        customerId: result.customerId,
        detail: `Se crea una nueva reserva`,
      });

      this.eventEmitter.emit(
        BOOKING_EVENTS.CREATED,
        new BookingCreatedEvent(result),
      );

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
