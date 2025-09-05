import { ChangeType, EntityType } from '@/domain/dbEnums/Activity-log.enum';

export class ActivityLog {
  constructor(
    public readonly id: number,
    public readonly entityType: EntityType,
    public readonly entityId: number,
    public readonly changeType: ChangeType,
    public readonly detail: string,
    public readonly userId: number | null,
    public readonly commerceId: number | null,
    public readonly customerId: number | null,
    public readonly timestamp: Date,
  ) {}

  private static create(
    changeType: ChangeType,
    props: {
      entityType: EntityType;
      entityId: number;
      detail: string;
      userId?: number | null;
      commerceId?: number | null;
      customerId?: number | null;
    },
  ): ActivityLog {
    return new ActivityLog(
      0,
      props.entityType,
      props.entityId,
      changeType,
      props.detail,
      props.userId ?? null,
      props.commerceId ?? null,
      props.customerId ?? null,
      new Date(),
    );
  }

  static createLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(ChangeType.CREATED, props);
  }

  static updateLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(ChangeType.UPDATED, props);
  }

  static cancelLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(ChangeType.CANCELED, props);
  }

  static suspendLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(ChangeType.SUSPENDED, props);
  }

  static reinstateLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(ChangeType.REINSTATED, props);
  }
}
