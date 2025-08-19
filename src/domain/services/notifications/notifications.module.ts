import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { ResendProvider } from '@/infrastructure/notifications/resend.provider';
import { ResendNotificationProvider } from '@/infrastructure/notifications/ResendNotificationProvider';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    ResendProvider,
    {
      provide: 'INotificationProvider',
      useClass: ResendNotificationProvider,
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
