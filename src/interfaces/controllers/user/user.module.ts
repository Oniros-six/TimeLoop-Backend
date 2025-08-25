import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateUser } from '@/application/use-cases/user/create.use-case';
import { FindUser } from '@/application/use-cases/user/find.use-case';
import { FindAllUsers } from '@/application/use-cases/user/find-all.use-case';
import { UpdateUser } from '@/application/use-cases/user/update.use-case';
import { SuspendUser } from '@/application/use-cases/user/suspend.use-case';
import { ReinstateUser } from '@/application/use-cases/user/reinstate.use-case';

// Tokens
import {
  COMMERCE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';

// Auth components
import { AuthService } from '@/domain/services/auth/auth.service';
import { BcryptPasswordHasher } from '@/infrastructure/auth/bcrypt-password-hasher';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: 'IPasswordHasher',
      useClass: BcryptPasswordHasher,
    },
    AuthService,
    CreateUser,
    FindUser,
    FindAllUsers,
    UpdateUser,
    SuspendUser,
    ReinstateUser,
  ],
})
export class UserModule {}
