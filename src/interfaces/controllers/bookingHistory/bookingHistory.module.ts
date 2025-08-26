import { Module } from '@nestjs/common';
import { BookingHistoryController } from './bookingHistory.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { FindByCommerce } from '@/application/use-cases/bookingHistory/find-by-commerce.use-case';
import { FindByUser } from '@/application/use-cases/bookingHistory/find-by-user.use-case';
import { FindByDates } from '@/application/use-cases/bookingHistory/find-by-dates.use-case';
import { FindByCommerceDate } from '@/application/use-cases/bookingHistory/find-by-date-commerce.use-case';
import { FindByUserDate } from '@/application/use-cases/bookingHistory/find-by-date-user.use-case';

// Tokens
import {
    COMMERCE_REPOSITORY,
    BOOKING_HISTORY_REPOSITORY,
    USER_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaBookingHistoryRepository } from '@/infrastructure/prisma/repositories/bookingHistory.repository';

@Module({
    imports: [PrismaModule],
    controllers: [BookingHistoryController],
    providers: [
        {
            provide: COMMERCE_REPOSITORY,
            useClass: PrismaCommerceRepository,
        },
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository,
        },
        {
            provide: BOOKING_HISTORY_REPOSITORY,
            useClass: PrismaBookingHistoryRepository,
        },
        
        FindByCommerce,
        FindByUser,
        FindByDates,
        FindByCommerceDate,
        FindByUserDate
    ],
})
export class BookingHistoryModule { }
