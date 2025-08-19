import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { NotificationModule } from '@/domain/services/notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  providers: [RemindersService, PrismaService],
})
export class RemindersModule {}
