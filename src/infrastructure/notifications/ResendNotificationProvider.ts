//src\infrastructure\notifications\notification-provider.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { RESEND_PROVIDER } from '@/application/constants/providers';
import { INotificationProvider } from '@/domain/services/notifications/notification-provider.interface';

@Injectable()
export class ResendNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(ResendNotificationProvider.name);

  constructor(@Inject(RESEND_PROVIDER) private readonly resend: Resend) {}

  async sendEmail(to: string, subject: string, body: string) {
    try {
      const result = await this.resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to,
        subject,
        html: `<p>${body}</p>`,
        text: body,
      });
      this.logger.log(`Email sent: ${subject} → ${to}`);
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${msg}`);
      throw error;
    }
  }

  sendWhatsApp(to: string, message: string): Promise<void> {
    throw new Error('Method not implemented. ', { cause: { to, message } });
  }
}
