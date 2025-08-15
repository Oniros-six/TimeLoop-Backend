import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { PrismaActivityLogRepository } from '@/infrastructure/prisma/repositories/activityLog.repository';
import { ACTIVITY_LOG_REPOSITORY } from '@/application/constants/providers';

@Module({
  providers: [
    ActivityLogService,
    PrismaService,
    {
      provide: ACTIVITY_LOG_REPOSITORY,
      useClass: PrismaActivityLogRepository,
    },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
