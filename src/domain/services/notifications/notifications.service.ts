//src\domain\services\notifications\notifications.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  BookingRescheduledEvent,
} from '@/domain/common/booking.events';
import { Booking } from '@/domain/entities/booking.entity';
import { INotificationProvider } from '@/domain/services/notifications/notification-provider.interface';
import { COMMERCE_REPOSITORY } from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CANCELLED: 'booking.cancelled',
  RESCHEDULED: 'booking.rescheduled',
} as const;

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

export interface INotificationService {
  notifyBookingCreated(booking: Booking): Promise<void>;
  notifyBookingCancelled(booking: Booking): Promise<void>;
  notifyBookingRescheduled(booking: Booking, newDate: Date): Promise<void>;
}
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('INotificationProvider')
    private readonly provider: INotificationProvider,
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}
  
  @OnEvent(BOOKING_EVENTS.CREATED)
  async handleBookingCreated(event: BookingCreatedEvent) {
    try {
      await this.notifyBookingCreated(event.booking);
    } catch (err: unknown) {
      this.logError(err, event.booking.id, 'BookingCreatedEvent');
    }
  }

  @OnEvent(BOOKING_EVENTS.CANCELLED)
  async handleBookingCancelled(event: BookingCancelledEvent) {
    try {
      await this.notifyBookingCancelled(event.booking);
    } catch (err: unknown) {
      this.logError(err, event.booking.id, 'BookingCancelledEvent');
    }
  }

  @OnEvent(BOOKING_EVENTS.RESCHEDULED)
  async handleBookingRescheduled(event: BookingRescheduledEvent) {
    try {
      await this.notifyBookingRescheduled(event.booking, event.newDate);
    } catch (err: unknown) {
      this.logError(err, event.booking.id, 'BookingRescheduledEvent');
    }
  }

  private logError(err: unknown, bookingId: number, eventName: string) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    this.logger.error(`Failed to handle ${eventName} for booking ${bookingId}: ${msg}`, err instanceof Error ? err.stack : '');
  }

  async notifyBookingCreated(booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking created: ${booking.id}`);
    const commerce = await this.commerceRepository.findCommerce({ commerceId: booking.commerceId });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha creado una reserva para el día ${booking.date} a las ${booking.timeStart}.`;
    await this.provider.sendEmail(commerce.email, 'Nueva reserva', message);
  }

  async notifyBookingCancelled(booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking cancelled: ${booking.id}`);
    const commerce = await this.commerceRepository.findCommerce({ commerceId: booking.commerceId });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha cancelado una reserva para el día ${booking.date} a las ${booking.timeStart}.`;
    await this.provider.sendEmail(commerce.email, 'Reserva cancelada', message);
  }

  async notifyBookingRescheduled(booking: Booking, newDate: Date): Promise<void> {
    this.logger.log(`Notifying booking rescheduled: ${booking.id} to ${newDate.toISOString()}`);
    const commerce = await this.commerceRepository.findCommerce({ commerceId: booking.commerceId });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha reprogramado una reserva para el día ${newDate.toISOString()} a las ${booking.timeStart}.`;
    await this.provider.sendEmail(commerce.email, 'Reserva reprogramada', message);
  }
}
