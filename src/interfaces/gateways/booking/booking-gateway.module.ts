import { Module } from '@nestjs/common';
import { BookingRealtimeGateway } from './booking-realtime.gateway';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { COMMERCE_REPOSITORY } from '@/application/providers';
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    BookingRealtimeGateway,
    BookingRealtimeNotifier,
  ],
  exports: [BookingRealtimeGateway, BookingRealtimeNotifier],
})
export class BookingGatewayModule {}
