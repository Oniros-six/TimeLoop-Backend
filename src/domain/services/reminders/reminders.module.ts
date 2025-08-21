import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RemindersService } from './reminders.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), EventEmitterModule],
  providers: [RemindersService, PrismaService],
  exports: [RemindersService],
})
export class RemindersModule {}
