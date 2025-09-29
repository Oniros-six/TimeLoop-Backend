import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { GetBasicDashboardInfo } from '@/application/use-cases/dashboard/get-basic-info.use-case';
import { GetDashboardMetrics } from '@/application/use-cases/dashboard/get-metrics.use-case';

// Tokens
import {
    DASHBOARD_REPOSITORY,
    USER_REPOSITORY,
    BOOKING_HISTORY_REPOSITORY,
    METRICS_REPOSITORY
} from '@/application/providers';

// Repositories
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaDashboardRepository } from '@/infrastructure/prisma/repositories/dashboard.repository';
import { PrismaBookingHistoryRepository } from '@/infrastructure/prisma/repositories/bookingHistory.repository';
import { PrismaMetricsRepository } from '@/infrastructure/prisma/repositories/metrics.repository';
@Module({
    imports: [PrismaModule],
    controllers: [DashboardController],
    providers: [
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository,
        },
        {
            provide: DASHBOARD_REPOSITORY,
            useClass: PrismaDashboardRepository,
        },
        {
            provide: BOOKING_HISTORY_REPOSITORY,
            useClass: PrismaBookingHistoryRepository,
        },
        {
            provide: METRICS_REPOSITORY,
            useClass: PrismaMetricsRepository,
        },

        GetBasicDashboardInfo,
        GetDashboardMetrics
    ],
})
export class DashboardModule { }
