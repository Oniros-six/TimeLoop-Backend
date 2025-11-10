import { Global, Module } from '@nestjs/common';
import { HoldCleanupService } from './hold-cleanup.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Global()
@Module({
  providers: [
    HoldCleanupService,
    PrismaService,
  ],
  exports: [HoldCleanupService],
})
export class HoldCleanupModule {}

