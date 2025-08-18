import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { CancelBookingDto } from '@/interfaces/controllers/booking/dto/cancel-booking.dto';
import { BOOKING_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingCancelledEvent } from '@/domain/common/booking.events';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';

@Injectable()
export class CancelBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: number, data: CancelBookingDto) {
    const { commerceId, customerId } = data;
    try {
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

      // Delegate cancellation validation to domain method
      if (!booking.canBeCancelled()) {
        throw new HttpException(
          'No se puede cancelar esta reserva',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.bookingRepository.cancelSchedule({ id: id });

      if (result === null) {
        throw new HttpException(
          'Error al cancelar el turno, intenta de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Activity register
      await this.activityLogService.cancelled({
        entityTypeId: ENTITY_TYPES.BOOKING,
        entityId: result.id,
        userId: null,
        commerceId: result.commerceId,
        customerId: result.customerId,
        detail: `Se cancela la reserva`,
      });

      // Emitir evento de cancelación
      this.eventEmitter.emit(
        BOOKING_EVENTS.CANCELLED,
        new BookingCancelledEvent(result),
      );

      return {
        message: 'La reserva ha sido cancelada exitosamente.',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al cancelar la reserva, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
