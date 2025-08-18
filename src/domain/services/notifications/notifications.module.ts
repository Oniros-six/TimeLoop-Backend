import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ResendProvider } from '@/infrastructure/notifications/resend.provider';
import { ResendNotificationProvider } from '@/infrastructure/notifications/ResendNotificationProvider';
import { COMMERCE_REPOSITORY } from '@/application/constants/providers';
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';

@Module({
  providers: [
    PrismaService,
    ResendProvider, 
    {
      provide: 'INotificationProvider',
      useClass: ResendNotificationProvider,
    },
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule { }
