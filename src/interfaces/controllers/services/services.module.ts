import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateService } from '@/application/use-cases/services/create.use-case';
import { FindService } from '@/application/use-cases/services/find.use-case';
import { FindAllServices } from '@/application/use-cases/services/find-all.use-case';
import { UpdateService } from '@/application/use-cases/services/update.use-case';
import { DeleteService } from '@/application/use-cases/services/delete.use-case';

// Tokens
import {
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaServicesRepository } from '@/infrastructure/prisma/repositories/services.repository';
import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [
    {
      provide: SERVICE_REPOSITORY,
      useClass: PrismaServicesRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },

    CreateService,
    FindService,
    FindAllServices,
    UpdateService,
    DeleteService,
  ],
})
export class ServicesModule {}
