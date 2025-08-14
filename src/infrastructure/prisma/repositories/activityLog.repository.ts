import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import { ActivityLog as DomainClient } from '@/domain/entities/activityLog.entity';

@Injectable()
export class PrismaActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(activity: {
    id: number;
    entityTypeId: number;
    entityId: number;
    changeTypeId: number;
    detail: string;
    userId: number | null;
    commerceId: number | null;
    customerId: number | null;
    timestamp: Date;
  }): DomainClient {
    return new DomainClient(
      activity.id,
      activity.entityTypeId,
      activity.entityId,
      activity.changeTypeId,
      activity.detail,
      activity.userId,
      activity.commerceId,
      activity.customerId,
      activity.timestamp,
    );
  }

  async create(data: {
    entityTypeId: number;
    entityId: number;
    changeTypeId: number;
    detail: string;
    userId: number | null;
    commerceId: number | null;
    customerId: number | null;
  }): Promise<DomainClient | null> {
    const {
      entityTypeId,
      entityId,
      changeTypeId,
      detail,
      userId,
      commerceId,
      customerId,
    } = data;
    const result = await this.prisma.activityLog.create({
      data: {
        entityTypeId: entityTypeId,
        entityId: entityId,
        userId: userId,
        commerceId: commerceId,
        customerId: customerId,
        changeTypeId: changeTypeId,
        detail: detail,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }
}
