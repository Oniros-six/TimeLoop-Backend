//src\domain\services\notifications\notifications.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BookingCreatedEvent,
  BookingCanceledEvent,
  BookingRescheduledEvent,
} from '@/domain/common/booking.events';
import { Booking } from '@/domain/entities/booking.entity';
import { INotificationProvider } from '@/domain/services/notifications/notification-provider.interface';
import {
  BOOKING_REPOSITORY,
  COMMERCE_REPOSITORY,
  CUSTOMER_REPOSITORY,
  REMINDER_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { Customer } from '@/domain/entities/customer.entity';
import { User } from '@/domain/entities/user.entity';
import { Commerce } from '@/domain/entities/commerce.entity';

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CANCELED: 'booking.canceled',
  RESCHEDULED: 'booking.rescheduled',
} as const;

export const REMINDER_EVENTS = {
  SEND: 'reminder.send',
} as const;

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

export interface INotificationService {
  notifyBookingCreated(booking: Booking): Promise<void>;
  notifyBookingCanceled(booking: Booking): Promise<void>;
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
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  @OnEvent(BOOKING_EVENTS.CREATED)
  async handleBookingCreated(event: BookingCreatedEvent) {
    try {
      const commerce = await this.commerceRepository.findCommerce({
        commerceId: event.booking.commerceId,
      });
      if (!commerce) throw new Error('Commerce not found');

      const user = await this.userRepository.findUser({
        userId: event.booking.userId,
      });
      if (!user) throw new Error('User not found');

      const customer = await this.customerRepository.findCustomer({
        id: event.booking.customerId,
      });
      if (!customer) throw new Error('Customer not found');

      await this.notifyBookingCreatedCommerce(customer, user, commerce, event.booking);
      await this.notifyBookingCreatedUser(customer, user, commerce, event.booking);
      await this.notifyBookingCreatedCustomer(customer, user, commerce, event.booking);
    } catch (err: unknown) {
      this.logError(err, event.booking.id, 'BookingCreatedEvent');
    }
  }

  @OnEvent(BOOKING_EVENTS.CANCELED)
  async handleBookingCanceled(event: BookingCanceledEvent) {
    try {
      await this.notifyBookingCanceled(event.booking);
    } catch (err: unknown) {
      this.logError(err, event.booking.id, 'BookingCanceledEvent');
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

  //*==================================== NOTIFY BOOKING CREATED COMMERCE ====================================
  async notifyBookingCreatedCommerce(customer: Customer, user: User, commerce: Commerce, booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking created: ${booking.id}`);

    const formattedStart = this.formatDateTime(booking.timeStart);

    const html = this.buildBookingEventHtml({
      title: 'Nueva reserva confirmada',
      intro: '¡Tu agenda tiene una nueva reserva! ✨',
      items: [
        { label: 'Fecha y hora', value: formattedStart },
        { label: 'Estado', value: 'Confirmada' },
        { label: 'Cliente', value: customer.name },
        { label: 'Profesional', value: user.name },
        { label: 'Tiempo de la cita', value: `${booking.duration} minutos` },
        { label: 'Precio', value: `$${booking.totalPrice}` },
        { label: 'Notas', value: booking.notes },
      ],
      footer: 'Puedes ver la reserva en tu panel de control.',
    });

    await this.provider.sendEmail({
      to: commerce.email,
      subject: 'Nueva reserva',
      html,
    });
  }
  //*==================================== NOTIFY BOOKING CREATED USER ====================================
  async notifyBookingCreatedUser(customer: Customer, user: User, commerce: Commerce, booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking created: ${booking.id}`);

    const formattedStart = this.formatDateTime(booking.timeStart);

    const html = this.buildBookingEventHtml({
      title: 'Nueva reserva confirmada',
      intro: '¡Tu agenda tiene una nueva reserva! ✨',
      items: [
        { label: 'Fecha y hora', value: formattedStart },
        { label: 'Estado', value: 'Confirmada' },
        { label: 'Cliente', value: customer.name },
        { label: 'Tiempo de la cita', value: `${booking.duration} minutos` },
        { label: 'Precio', value: `$${booking.totalPrice}` },
        { label: 'Notas', value: booking.notes },
      ],
      footer: 'Puedes ver la reserva en tu panel de control.',
    });

    await this.provider.sendEmail({
      to: user.email,
      subject: 'Nueva reserva',
      html,
    });
  }

  //*==================================== NOTIFY BOOKING CREATED CUSTOMER ====================================
  async notifyBookingCreatedCustomer(customer: Customer, user: User, commerce: Commerce, booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking created: ${booking.id}`);

    const formattedStart = this.formatDateTime(booking.timeStart);

    const html = this.buildBookingEventHtml({
      title: 'Detalles de tu reserva',
      intro: '¡Tu reserva ha sido creada con éxito! ✨',
      items: [
        { label: 'Comercio', value: commerce.name },
        { label: 'Profesional', value: user.name },
        { label: 'Dirección', value: commerce.address },
        { label: 'Fecha y hora', value: formattedStart },
        { label: 'Tiempo de la cita', value: `${booking.duration} minutos` },
        { label: 'Precio', value: `$${booking.totalPrice}` },
        { label: 'Notas', value: booking.notes },
      ],
      footer: `
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/booking/${booking.id}" style="color: #007bff;">Ver reserva</a>
        </p>
      `,
    });

    await this.provider.sendEmail({
      to: customer.email,
      subject: 'Detalles de tu reserva',
      html,
    });
  }

  //*==================================== NOTIFY BOOKING CANCELED ====================================
  async notifyBookingCanceled(booking: Booking): Promise<void> {
    this.logger.log(`Notifying booking canceled: ${booking.id}`);
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: booking.commerceId,
    });
    if (!commerce) throw new Error('Commerce not found');

    const user = await this.userRepository.findUser({
      userId: booking.userId,
    });
    if (!user) throw new Error('User not found');

    const customer = await this.customerRepository.findCustomer({
      id: booking.customerId,
    });
    if (!customer) throw new Error('Customer not found');

    const formattedStart = this.formatDateTime(booking.timeStart);

    const html = this.buildBookingEventHtml({
      title: 'Reserva cancelada',
      intro: 'Una reserva ha sido cancelada.',
      items: [
        { label: 'Fecha y hora', value: formattedStart },
        { label: 'Estado', value: 'Cancelada' },
        { label: 'Cliente', value: customer.name },
        { label: 'Profesional', value: user.name },
        { label: 'Tiempo de la cita', value: `${booking.duration} minutos` },
        { label: 'Precio', value: `$${booking.totalPrice}` },
        { label: 'Notas', value: booking.notes },
      ],
      footer: '',
    });

    await this.provider.sendEmail({
      to: commerce.email,
      subject: 'Reserva cancelada',
      html,
    });
  }

  //*==================================== NOTIFY BOOKING RESCHEDULED ====================================
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

    const user = await this.userRepository.findUser({
      userId: booking.userId,
    });
    if (!user) throw new Error('User not found');

    const customer = await this.customerRepository.findCustomer({
      id: booking.customerId,
    });
    if (!customer) throw new Error('Customer not found');

    const formattedStart = this.formatDateTime(newDate);

    const html = this.buildBookingEventHtml({
      title: 'Reserva reprogramada',
      intro: 'Una reserva ha sido reprogramada.',
      items: [
        { label: 'Nueva fecha y hora', value: formattedStart },
        { label: 'Estado', value: 'Reprogramada' },
        { label: 'Cliente', value: customer.name },
        { label: 'Profesional', value: user.name },
        { label: 'Tiempo de la cita', value: `${booking.duration} minutos` },
        { label: 'Precio', value: `$${booking.totalPrice}` },
        { label: 'Notas', value: booking.notes },
      ],
      footer:
        'Tu agenda a sido actualizada con éxito.',
    });

    await this.provider.sendEmail({
      to: commerce.email,
      subject: 'Reserva reprogramada',
      html,
    });
  }

  //*==================================== NOTIFY BOOKING REMINDER ====================================
  async notifyBookingReminder(data: ReminderDTO) {
    if (data.channel !== 'email') return;

    this.logger.log(
      `Sending reminder for booking ${data.scheduledAt.toISOString()} to ${data.customerEmail}`,
    );

    const [commerce, booking] = await Promise.all([
      this.commerceRepository.findCommerce({
        commerceId: data.commerceId,
      }),
      this.bookingRepository.findOne({ id: data.bookingId }),
    ]);

    if (!commerce) throw new Error('Commerce not found');
    if (!booking) throw new Error('Booking not found');

    const user = await this.userRepository.findUser({
      userId: booking.userId,
    });

    const formattedDate = this.formatDate(data.scheduledAt);
    const formattedTime = this.formatTime(data.scheduledAt);

    const html = this.buildReminderHtml({
      commerceName: commerce.name,
      commerceLogo: commerce.logo,
      commerceAddress: data.commerceAddress,
      customerName: data.customerName,
      professionalName: user?.name,
      date: formattedDate,
      time: formattedTime,
      cancelUrl: data.cancelUrl,
    });

    const result = await this.provider.sendEmail({
      to: data.customerEmail,
      subject: 'Recordatorio de reserva',
      html,
    });

    if (result) {
      this.logger.log(`Email sent: ${data.customerEmail}`);
      await this.reminderRepository.updateSent(data.id);
    }

    // if (data.channel === 'whatsapp') {
    //   await this.provider.sendWhatsapp(data.customerPhone, 'Recordatorio de reserva', message);
    // }
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      timeStyle: 'short',
    }).format(date);
  }

  private buildBookingEventHtml({
    title,
    intro,
    items,
    footer,
  }: {
    title: string;
    intro: string;
    items: Array<{ label: string; value: string }>;
    footer?: string;
  }): string {
    const itemsHtml = items
      .map(
        ({ label, value }) =>
          `<li style="margin-bottom: 6px;"><strong>${label}:</strong> ${value}</li>`,
      )
      .join('');

    const footerSection = footer
      ? `<p style="margin-top: 20px;">${footer}</p>`
      : '';

    return `<!DOCTYPE html>
              <html lang="es">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>${title}</title>
                </head>
                <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="text-align: center; color: #333;">${title}</h2>
                    <p>${intro}</p>
                    <ul style="list-style: none; padding-left: 0;">
                      ${itemsHtml}
                    </ul>
                    ${footerSection}
                  </div>
                </body>
              </html>`;
  }

  private buildReminderHtml({
    commerceName,
    commerceLogo,
    commerceAddress,
    customerName,
    professionalName,
    date,
    time,
    cancelUrl,
  }: {
    commerceName: string;
    commerceLogo?: string;
    commerceAddress: string;
    customerName: string;
    professionalName?: string;
    date: string;
    time: string;
    cancelUrl?: string;
  }): string {
    const logoSection = commerceLogo
      ? `<div style="text-align: center;">
        <img src="${commerceLogo}" alt="Logo del comercio" style="width: 80px; height: auto; margin-bottom: 10px;" />
      </div>`
      : '';

    const professional = professionalName ?? `Equipo ${commerceName}`;

    const actionSection = cancelUrl
      ? `<p style="margin-top: 20px; font-size: 14px;">
        Si deseas cancelar o reprogramar tu turno, haz clic aquí:
        <a href="${cancelUrl}" style="color: #007bff;">Cancelar turno</a>
      </p>`
      : `<p style="margin-top: 20px; font-size: 14px;">
        Si deseas cancelar o reprogramar tu turno, ponte en contacto con nosotros para ayudarte.
      </p>`;

    return `<!DOCTYPE html>
              <html lang="es">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Recordatorio de turno</title>
                </head>
                <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${logoSection}

                    <h2 style="text-align: center; color: #333;">Recordatorio: ¡Tienes una reserva próximamente!</h2>

                    <p>¡Hola ${customerName}! Solo queríamos recordarte que tienes un turno próximamente. Aquí están los detalles:</p>

                    <ul style="list-style: none; padding-left: 0;">
                      <li><strong>Comercio:</strong> ${commerceName}</li>
                      <li><strong>Profesional:</strong> ${professional}</li>
                      <li><strong>Día:</strong> ${date}</li>
                      <li><strong>Hora:</strong> ${time}</li>
                      <li><strong>Dirección:</strong> ${commerceAddress}</li>
                    </ul>

                    <p style="margin-top: 20px;">Muchas gracias por elegirnos.<br />
                    Te estaremos esperando.</p>

                    <p style="font-weight: bold; margin-top: 10px;">Equipo ${commerceName}</p>

                    ${actionSection}
                  </div>
                </body>
              </html>`;
  }
}
