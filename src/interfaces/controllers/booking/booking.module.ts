import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { NotificationModule } from '@/domain/services/notifications/notifications.module';

// Use cases
import { CreateBooking } from '@/application/use-cases/booking/create.use-case';
import { UpdateBooking } from '@/application/use-cases/booking/update.use-case';
import { FindAllByCommerceAndDate } from '@/application/use-cases/booking/find-all-by-date-commerce.use-case';
import { FindBusySlots } from '@/application/use-cases/booking/find-busy-slots.use-case';
import { FindAllByCommerce } from '@/application/use-cases/booking/find-all-by-commerce.use-case';
import { FindAllByUser } from '@/application/use-cases/booking/find-all-by-user.use-case';
import { CancelBooking } from '@/application/use-cases/booking/cancel.use-case';

// Tokens
import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaBookingRepository } from '@/infrastructure/prisma/repositories/booking.repository';
import { PrismaServicesRepository } from '@/infrastructure/prisma/repositories/services.repository';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [BookingController],
  providers: [
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
    {
      provide: SERVICE_REPOSITORY,
      useClass: PrismaServicesRepository,
    },

    // usesCases
    CreateBooking,
    UpdateBooking,
    FindAllByCommerceAndDate,
    FindBusySlots,
    FindAllByCommerce,
    FindAllByUser,
    CancelBooking,
  ],
})
export class BookingModule {}
