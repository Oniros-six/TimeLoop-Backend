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
import {
  COMMERCE_REPOSITORY,
  REMINDER_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CANCELLED: 'booking.cancelled',
  RESCHEDULED: 'booking.rescheduled',
} as const;

export const REMINDER_EVENTS = {
  SEND: 'reminder.send',
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
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
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

  @OnEvent(REMINDER_EVENTS.SEND)
  async handleReminderSend(reminder: ReminderDTO) {
    try {
      await this.notifyBookingReminder(reminder);
    } catch (err: unknown) {
      this.logError(err, reminder.id, 'ReminderSendEvent');
    }
  }

  private logError(err: unknown, bookingId: number, eventName: string) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    this.logger.error(
      `Failed to handle ${eventName} for booking ${bookingId}: ${msg}`,
      err instanceof Error ? err.stack : '',
    );
  }

  async notifyBookingCreated(booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking created: ${booking.id}`);
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: booking.commerceId,
    });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha creado una reserva para el día ${booking.date.toISOString()}`;
    await this.provider.sendEmail(commerce.email, 'Nueva reserva', message);
  }

  async notifyBookingCancelled(booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking cancelled: ${booking.id}`);
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: booking.commerceId,
    });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha cancelado una reserva para el día ${booking.date.toISOString()}`;
    await this.provider.sendEmail(commerce.email, 'Reserva cancelada', message);
  }

  async notifyBookingRescheduled(
    booking: Booking,
    newDate: Date,
  ): Promise<void> {
    this.logger.log(
      `Notifying booking rescheduled: ${booking.id} to ${newDate.toISOString()}`,
    );
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: booking.commerceId,
    });
    if (!commerce) throw new Error('Commerce not found');

    const message = `Se ha reprogramado una reserva para el día ${newDate.toISOString()}`;
    await this.provider.sendEmail(
      commerce.email,
      'Reserva reprogramada',
      message,
    );
  }

  async notifyBookingReminder(data: ReminderDTO) {
    if (data.channel === 'email') {
      this.logger.log(
        `Sending reminder for booking ${data.scheduledAt.toISOString()} to ${data.customerEmail}`,
      );

      const message = `Hola ${data.customerName}, te recordamos que tienes una reserva para el día ${data.scheduledAt.toISOString()} en ${data.commerceName} ubicado en ${data.commerceAddress}.
      Porfavor asistir 5 minutos antes de la hora de la reserva, 
      y en caso de que no puedas asistir, por favor cancelar la reserva o reprogramarla 
      mediante el botón de cancelación o reprogramación que se encuentra en el correo de confirmación de la reserva.`;

      const result = await this.provider.sendEmail(
        data.customerEmail,
        'Recordatorio de reserva',
        message,
      );

      if (result) {
        this.logger.log(`Email sent: ${data.customerEmail}`);
        await this.reminderRepository.updateSent(data.id);
      }
    }

    // if (data.channel === 'whatsapp') {
    //   await this.provider.sendWhatsapp(data.customerPhone, 'Recordatorio de reserva', message);
    // }
  }
}
