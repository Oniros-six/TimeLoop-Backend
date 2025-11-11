import { CreateEmailResponse } from 'resend';

export type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export interface INotificationProvider {
  sendEmail(payload: EmailPayload): Promise<CreateEmailResponse>;
  sendWhatsApp(to: string, message: string): Promise<void>;
}
