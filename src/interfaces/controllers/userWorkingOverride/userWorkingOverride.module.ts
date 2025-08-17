import { Module } from '@nestjs/common';
import { UserWorkingOverrideController } from './userWorkingOverride.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/create.use-case';
import { UpdateUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/update.use-case';
import { FindAllUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/findAll.use-case';

// Tokens
import {
  USER_REPOSITORY,
  USER_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaUserWorkingOverrideRepository } from '@/infrastructure/prisma/repositories/userWorkingOverride.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UserWorkingOverrideController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: USER_WORKING_OVERRIDE_REPOSITORY,
      useClass: PrismaUserWorkingOverrideRepository,
    },

    CreateUserWorkingOverride,
    UpdateUserWorkingOverride,
    FindAllUserWorkingOverride,
  ],
})
export class UserWorkingOverrideModule {}
