import { Module } from '@nestjs/common';
import { CommerceWorkingPatternController } from './commerceWorkingPattern.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/create.use-case';
import { UpdateCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/update.use-case';
import { FindAllCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/findAll.use-case';

// Tokens
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaCommerceWorkingPatternRepository } from '@/infrastructure/prisma/repositories/commerceWorkingPattern.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommerceWorkingPatternController],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: COMMERCE_WORKING_PATTERN_REPOSITORY,
      useClass: PrismaCommerceWorkingPatternRepository,
    },

    CreateCommerceWorkingPattern,
    UpdateCommerceWorkingPattern,
    FindAllCommerceWorkingPattern,
  ],
})
export class CommerceWorkingPatternModule {}
