import { Injectable } from '@nestjs/common';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaActivityLogRepository implements IActivityLogRepository{
  constructor(private readonly prisma: PrismaService) {}

  async create(log: ActivityLog) {
    return this.prisma.activityLog.create({
      data: {
        entityTypeId: log.entityTypeId,
        entityId: log.entityId,
        changeTypeId: log.changeTypeId,
        detail: log.detail,
        userId: log.userId,
        commerceId: log.commerceId,
        customerId: log.customerId,
        timestamp: log.timestamp,
      },
    });
  }
}
