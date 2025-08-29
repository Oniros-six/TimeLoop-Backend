import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RemindersService } from './reminders.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Global()
@Module({
  imports: [EventEmitterModule],
  providers: [RemindersService, PrismaService],
  exports: [RemindersService],
})
export class RemindersModule {}
