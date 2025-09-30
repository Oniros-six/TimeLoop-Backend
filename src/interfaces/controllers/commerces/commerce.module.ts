import { Module } from '@nestjs/common';
import { CommerceController } from './commerce.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

// Use cases
import { CreateCommerce } from '@/application/use-cases/commerce/create.use-case';
import { FindCommerce } from '@/application/use-cases/commerce/find.use-case';
import { UpdateCommerce } from '@/application/use-cases/commerce/update.use-case';
import { SuspendCommerce } from '@/application/use-cases/commerce/suspend.use-case';
import { ReinstateCommerce } from '@/application/use-cases/commerce/reinstate.use-case';
import { UploadCommerceLogo } from '@/application/use-cases/commerce/upload-logo.use-case';

// Tokens
import { COMMERCE_REPOSITORY, CLOUDINARY_REPOSITORY } from '@/application/providers';

// Repositories / Providers
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommerceController],
  providers: [
    {
      provide: COMMERCE_REPOSITORY,
      useClass: PrismaCommerceRepository,
    },
    {
      provide: CLOUDINARY_REPOSITORY,
      useClass: CloudinaryService,
    },

    // Use cases
    CreateCommerce,
    FindCommerce,
    UpdateCommerce,
    SuspendCommerce,
    ReinstateCommerce,
    UploadCommerceLogo,
  ],
})
export class CommerceModule {}
