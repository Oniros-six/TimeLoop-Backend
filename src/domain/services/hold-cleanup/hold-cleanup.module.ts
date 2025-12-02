import { Global, Module, forwardRef } from '@nestjs/common';
import { HoldCleanupService } from './hold-cleanup.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingGatewayModule } from '@/interfaces/gateways/booking/booking-gateway.module';
import { BOOKING_REALTIME_NOTIFIER } from '@/application/providers';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';

@Global()
@Module({
  imports: [forwardRef(() => BookingGatewayModule)],
  providers: [
    HoldCleanupService,
    PrismaService,
    {
      provide: BOOKING_REALTIME_NOTIFIER,
      useExisting: BookingRealtimeNotifier,
    },
  ],
  exports: [HoldCleanupService],
})
export class HoldCleanupModule {}

