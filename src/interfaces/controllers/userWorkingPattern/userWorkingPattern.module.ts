import { Module } from '@nestjs/common';
import { UserWorkingPatternController } from './userWorkingPattern.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/create.use-case';
import { UpdateUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/update.use-case';
import { FindAllUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/findAll.use-case';

// Tokens
import {
  USER_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/constants/providers';

// Repositories
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaUserWorkingPatternRepository } from '@/infrastructure/prisma/repositories/userWorkingPattern.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UserWorkingPatternController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: USER_WORKING_PATTERN_REPOSITORY,
      useClass: PrismaUserWorkingPatternRepository,
    },

    CreateUserWorkingPattern,
    UpdateUserWorkingPattern,
    FindAllUserWorkingPattern,
  ],
})
export class UserWorkingPatternModule {}
