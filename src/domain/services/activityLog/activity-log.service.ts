import { Inject, Injectable } from '@nestjs/common';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import { ACTIVITY_LOG_REPOSITORY } from '@/application/providers';

@Injectable()
export class ActivityLogService {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly repository: IActivityLogRepository,
  ) {}

  async log(log: ActivityLog) {
    return this.repository.create(log);
  }

  // Métodos de conveniencia para cada tipo de cambio
  async created(props: Parameters<typeof ActivityLog.createLog>[0]) {
    const log = ActivityLog.createLog(props);
    return this.log(log);
  }

  async updated(props: Parameters<typeof ActivityLog.updateLog>[0]) {
    const log = ActivityLog.updateLog(props);
    return this.log(log);
  }

  async cancelled(props: Parameters<typeof ActivityLog.cancelLog>[0]) {
    const log = ActivityLog.cancelLog(props);
    return this.log(log);
  }

  async suspended(props: Parameters<typeof ActivityLog.suspendLog>[0]) {
    const log = ActivityLog.suspendLog(props);
    return this.log(log);
  }

  async reinstated(props: Parameters<typeof ActivityLog.reinstateLog>[0]) {
    const log = ActivityLog.reinstateLog(props);
    return this.log(log);
  }
}
