import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { GetDashboardInfo } from '@/application/use-cases/dashboard/get-info.use-case';

// Tokens
import {
    DASHBOARD_REPOSITORY,
    USER_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaDashboardRepository } from '@/infrastructure/prisma/repositories/dashboard.repository';

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

        GetDashboardInfo
    ],
})
export class DashboardModule { }
