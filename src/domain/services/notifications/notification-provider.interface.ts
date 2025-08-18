
//src\domain\services\notifications\notification-provider.interface.ts
export interface INotificationProvider {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendWhatsApp(to: string, message: string): Promise<void>;
    // podés agregar otros canales más adelante
  }