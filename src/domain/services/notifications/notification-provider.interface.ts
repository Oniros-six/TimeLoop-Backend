import { CreateEmailResponse } from 'resend';

//src\domain\services\notifications\notification-provider.interface.ts
export interface INotificationProvider {
  sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<CreateEmailResponse>;
  sendWhatsApp(to: string, message: string): Promise<void>;
}
