export class ActivityLog {
  constructor(
    public readonly id: number,
    public readonly entityTypeId: number,
    public readonly entityId: number,
    public readonly changeTypeId: number,
    public readonly detail: string,
    public readonly userId: number | null,
    public readonly commerceId: number | null,
    public readonly customerId: number | null,
    public readonly timestamp: Date,
  ) {}
}
