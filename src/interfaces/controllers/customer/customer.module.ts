import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCustomer } from '@/application/use-cases/customer/create.use-case';
import { FindCustomer } from '@/application/use-cases/customer/find.use-case';
import { FindAllCustomersByCommerce } from '@/application/use-cases/customer/find-all-by-commerce.use-case';
import { UpdateCustomer } from '@/application/use-cases/customer/update.use-case';

// Tokens
import {
  ACTIVITY_LOG_REPOSITORY,
  COMMERCE_REPOSITORY,
  CUSTOMER_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaActivityLogRepository } from '@/infrastructure/prisma/repositories/activityLog.repository';
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaCustomerRepository } from '@/infrastructure/prisma/repositories/customer.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: PrismaCustomerRepository,
    },
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: ACTIVITY_LOG_REPOSITORY,
      useClass: PrismaActivityLogRepository,
    },

    CreateCustomer,
    FindCustomer,
    FindAllCustomersByCommerce,
    UpdateCustomer,
  ],
})
export class CustomerModule {}
