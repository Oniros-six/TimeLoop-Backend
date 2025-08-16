import { Module } from '@nestjs/common';
import { CommerceConfigController } from './commerceConfig.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCommerceConfig } from '@/application/use-cases/commerceConfig/create.use-case';
import { UpdateCommerceConfig } from '@/application/use-cases/commerceConfig/update.use-case';
import { FindCommerceConfig } from '@/application/use-cases/commerceConfig/find.use-case';

// Tokens
import {
  COMMERCE_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaCommerceConfigRepository } from '@/infrastructure/prisma/repositories/commerceConfig.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommerceConfigController],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: COMMERCE_CONFIG_REPOSITORY,
      useClass: PrismaCommerceConfigRepository,
    },

    CreateCommerceConfig,
    UpdateCommerceConfig,
    FindCommerceConfig,
  ],
})
export class CommerceConfigModule {}
