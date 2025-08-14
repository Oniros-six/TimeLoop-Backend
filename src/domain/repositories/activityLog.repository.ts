import { ActivityLog } from '../entities/activityLog.entity';

export interface IActivityLogRepository {
  create(data: {
    entityTypeId: number;
    entityId: number;
    changeTypeId: number;
    detail: string;
    userId: number | null;
    commerceId: number | null;
    customerId: number | null;
  }): Promise<ActivityLog | null>;
}
