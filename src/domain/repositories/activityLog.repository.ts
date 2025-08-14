import { ActivityLog } from '@/domain/entities/activityLog.entity';

export interface IActivityLogRepository {
  create(log: ActivityLog): Promise<ActivityLog | null>;
}
