import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { CancelBookingDto } from '@/interfaces/controllers/booking/dto/cancel-booking.dto';
import {
  BOOKING_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
} from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingCanceledEvent } from '@/domain/common/booking.events';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';

@Injectable()
export class CancelBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly eventEmitter: EventEmitter2,

    private readonly remindersService: RemindersService,
  ) {}

  async execute(id: number, data: CancelBookingDto) {
    const { commerceId, customerId } = data;
    //* Confirmamos la existencia del booking
    const booking = await this.bookingRepository.findOne({ id: id });

    //* Validamos que se pueda cancelar
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

    const commerceConfig =
      await this.commerceConfigRepository.findCommerceConfig({ commerceId });

    // Delegate cancellation validation to domain method
    if (!booking.canBeCanceled(commerceConfig.cancellationDeadlineMinutes)) {
      throw new HttpException(
        'No se puede cancelar esta reserva',
        HttpStatus.BAD_REQUEST,
      );
    }

    //* Generamos el cambio
    const result = await this.bookingRepository.cancelSchedule({ id: id });

    if (result === null) {
      throw new HttpException(
        'Error al cancelar el turno, intenta de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* Guardamos la actividad
    await this.activityLogService.canceled({
      entityType: EntityType.BOOKING,
      entityId: result.id,
      userId: null,
      commerceId: result.commerceId,
      customerId: result.customerId,
      detail: `Se cancela la reserva`,
    });

    //* Cancelamos el reminder
    await this.remindersService.cancelReminder(result.id);

    //* Emitir evento de cancelación
    this.eventEmitter.emit(
      BOOKING_EVENTS.CANCELED,
      new BookingCanceledEvent(result),
    );

    return {
      message: 'La reserva ha sido cancelada exitosamente.',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
