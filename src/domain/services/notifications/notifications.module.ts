import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationService } from './notifications.service';
import { ResendProvider } from '@/infrastructure/notifications/resend.provider';
import { ResendNotificationProvider } from '@/infrastructure/notifications/ResendNotificationProvider';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { CUSTOMER_REPOSITORY, REMINDER_REPOSITORY } from '@/application/providers';
import { PrismaReminderRepository } from '@/infrastructure/prisma/repositories/reminder.repository';
import { PrismaCustomerRepository } from '@/infrastructure/prisma/repositories/customer.repository';

@Module({
  imports: [PrismaModule, EventEmitterModule],
  providers: [
    ResendProvider,
    {
      provide: 'INotificationProvider',
      useClass: ResendNotificationProvider,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: PrismaCustomerRepository,
    },
    {
      provide: REMINDER_REPOSITORY,
      useClass: PrismaReminderRepository,
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
