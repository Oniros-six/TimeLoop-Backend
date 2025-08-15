import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { CancelBookingDto } from '@/interfaces/controllers/booking/dto/cancel-booking.dto';
import { BOOKING_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';

@Injectable()
export class CancelBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    private readonly activityLogService: ActivityLogService,
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

      //TODO At this point we send notifications to the owner and verification to the customer (depending on commerce config)

      return {
        message: 'Reserva cancelada con exito',
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
