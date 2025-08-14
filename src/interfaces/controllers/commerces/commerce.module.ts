import { Module } from '@nestjs/common';
import { CommerceController } from './commerce.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCommerce } from '@/application/use-cases/commerce/create.use-case';
import { FindCommerce } from '@/application/use-cases/commerce/find.use-case';
import { UpdateCommerce } from '@/application/use-cases/commerce/update.use-case';
import { SuspendCommerce } from '@/application/use-cases/commerce/suspend.use-case';
import { ReinstateCommerce } from '@/application/use-cases/commerce/reinstate.use-case';

// Tokens
import {
  ACTIVITY_LOG_REPOSITORY,
  COMMERCE_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaActivityLogRepository } from '@/infrastructure/prisma/repositories/activityLog.repository';
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommerceController],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: ACTIVITY_LOG_REPOSITORY,
      useClass: PrismaActivityLogRepository,
    },

    CreateCommerce,
    FindCommerce,
    UpdateCommerce,
    SuspendCommerce,
    ReinstateCommerce
  ],
})
export class CommerceModule {}
