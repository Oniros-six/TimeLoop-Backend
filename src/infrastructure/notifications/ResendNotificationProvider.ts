//src\infrastructure\notifications\notification-provider.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { RESEND_PROVIDER } from '@/application/providers';
import {
  EmailPayload,
  INotificationProvider,
} from '@/domain/services/notifications/notification-provider.interface';

@Injectable()
export class ResendNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(ResendNotificationProvider.name);

  constructor(@Inject(RESEND_PROVIDER) private readonly resend: Resend) {}

  async sendEmail({ to, subject, text, html }: EmailPayload) {
    const from = 'onboarding@resend.dev';

    if (!html && !text) {
      throw new Error('Email payload must include html or text content');
    }

    try {
      const emailPayload: Record<string, unknown> = {
        from,
        to,
        subject,
      };

      if (html) emailPayload.html = html;
      if (text) emailPayload.text = text;
      if (!emailPayload.html && text) {
        emailPayload.html = `<p>${text}</p>`;
      }

      const result = await this.resend.emails.send(
        emailPayload as unknown as Parameters<Resend['emails']['send']>[0],
      );
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
