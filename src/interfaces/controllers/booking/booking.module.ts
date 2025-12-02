import { Module, forwardRef } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingHoldController } from './booking-hold.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { NotificationModule } from '@/domain/services/notifications/notifications.module';
import { BookingGatewayModule } from '@/interfaces/gateways/booking/booking-gateway.module';

// Use cases
import { CreateBooking } from '@/application/use-cases/booking/create.use-case';
import { UpdateBooking } from '@/application/use-cases/booking/update.use-case';
import { FindAllByUserAndDate } from '@/application/use-cases/booking/find-all-by-date-user.use-case';
import { FindAllByCommerce } from '@/application/use-cases/booking/find-all-by-commerce.use-case';
import { FindAllByUser } from '@/application/use-cases/booking/find-all-by-user.use-case';
import { CancelBooking } from '@/application/use-cases/booking/cancel.use-case';
import { FindCommerceConfig } from '@/application/use-cases/commerceConfig/find.use-case';
import { CreateHold } from '@/application/use-cases/booking/create-hold.use-case';
import { ConfirmHold } from '@/application/use-cases/booking/confirm-hold.use-case';
import { GetAvailability } from '@/application/use-cases/booking/get-availability.use-case';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';
import { BookingPersistenceService } from '@/application/services/booking/booking-persistence.service';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';

// Tokens
import {
  BOOKING_HISTORY_REPOSITORY,
  BOOKING_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  BOOKING_REALTIME_NOTIFIER,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaBookingRepository } from '@/infrastructure/prisma/repositories/booking.repository';
import { PrismaServicesRepository } from '@/infrastructure/prisma/repositories/services.repository';
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaBookingHistoryRepository } from '@/infrastructure/prisma/repositories/bookingHistory.repository';
import { PrismaCommerceConfigRepository } from '@/infrastructure/prisma/repositories/commerceConfig.repository';
import { PrismaCommerceWorkingPatternRepository } from '@/infrastructure/prisma/repositories/commerceWorkingPattern.repository';
import { PrismaUserWorkingPatternRepository } from '@/infrastructure/prisma/repositories/userWorkingPattern.repository';

@Module({
  imports: [PrismaModule, NotificationModule, forwardRef(() => BookingGatewayModule)],
  controllers: [BookingController, BookingHoldController],
  providers: [
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
    {
      provide: SERVICE_REPOSITORY,
      useClass: PrismaServicesRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: BOOKING_HISTORY_REPOSITORY,
      useClass: PrismaBookingHistoryRepository,
    },
    {
      provide: COMMERCE_CONFIG_REPOSITORY,
      useClass: PrismaCommerceConfigRepository,
    },
    {
      provide: BOOKING_REALTIME_NOTIFIER,
      useExisting: BookingRealtimeNotifier,
    },
    {
      provide: COMMERCE_WORKING_PATTERN_REPOSITORY,
      useClass: PrismaCommerceWorkingPatternRepository,
    },
    {
      provide: USER_WORKING_PATTERN_REPOSITORY,
      useClass: PrismaUserWorkingPatternRepository,
    },

    // usesCases
    CreateBooking,
    UpdateBooking,
    FindAllByUserAndDate,
    FindAllByCommerce,
    FindAllByUser,
    CancelBooking,
    FindCommerceConfig,
    CreateHold,
    ConfirmHold,
    GetAvailability,
    BookingPersistenceService,
    WorkingPatternValidator,
  ],
})
export class BookingModule {}
