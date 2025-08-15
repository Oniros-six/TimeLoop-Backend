import {
  CHANGE_TYPES,
  ENTITY_TYPES,
} from '@/application/constants/activity-log.constants';

export class ActivityLog {
  constructor(
    public readonly id: number,
    public readonly entityTypeId: ENTITY_TYPES,
    public readonly entityId: number,
    public readonly changeTypeId: CHANGE_TYPES,
    public readonly detail: string,
    public readonly userId: number | null,
    public readonly commerceId: number | null,
    public readonly customerId: number | null,
    public readonly timestamp: Date,
  ) {}

  private static create(
    changeTypeId: CHANGE_TYPES,
    props: {
      entityTypeId: ENTITY_TYPES;
      entityId: number;
      detail: string;
      userId?: number | null;
      commerceId?: number | null;
      customerId?: number | null;
    },
  ): ActivityLog {
    return new ActivityLog(
      0,
      props.entityTypeId,
      props.entityId,
      changeTypeId,
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
    return this.create(CHANGE_TYPES.CREATED, props);
  }

  static updateLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(CHANGE_TYPES.UPDATED, props);
  }

  static cancelLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(CHANGE_TYPES.CANCELLED, props);
  }

  static suspendLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(CHANGE_TYPES.SUSPENDED, props);
  }

  static reinstateLog(
    props: Parameters<typeof ActivityLog.create>[1],
  ): ActivityLog {
    return this.create(CHANGE_TYPES.REINSTATED, props);
  }
}
