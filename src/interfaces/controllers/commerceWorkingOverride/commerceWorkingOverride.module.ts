import { Module } from '@nestjs/common';
import { CommerceWorkingOverrideController } from './commerceWorkingOverride.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/create.use-case';
import { UpdateCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/update.use-case';
import { FindAllCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/findAll.use-case';

// Tokens
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaCommerceWorkingOverrideRepository } from '@/infrastructure/prisma/repositories/commerceWorkingOverride.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommerceWorkingOverrideController],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: COMMERCE_WORKING_OVERRIDE_REPOSITORY,
      useClass: PrismaCommerceWorkingOverrideRepository,
    },

    CreateCommerceWorkingOverride,
    UpdateCommerceWorkingOverride,
    FindAllCommerceWorkingOverride,
  ],
})
export class CommerceWorkingOverrideModule {}
