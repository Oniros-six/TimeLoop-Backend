import { Module } from '@nestjs/common';
import { UserConfigController } from './userConfig.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateUserConfig } from '@/application/use-cases/userConfig/create.use-case';
import { UpdateUserConfig } from '@/application/use-cases/userConfig/update.use-case';
import { FindUserConfig } from '@/application/use-cases/userConfig/find.use-case';

// Tokens
import {
  USER_REPOSITORY,
  USER_CONFIG_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';
import { PrismaUserConfigRepository } from '@/infrastructure/prisma/repositories/userConfig.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UserConfigController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: USER_CONFIG_REPOSITORY,
      useClass: PrismaUserConfigRepository,
    },

    CreateUserConfig,
    UpdateUserConfig,
    FindUserConfig,
  ],
})
export class UserConfigModule {}
