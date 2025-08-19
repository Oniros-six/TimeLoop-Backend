export class ReminderDTO {
  constructor(
    public readonly id: number,
    public readonly scheduledAt: Date,
    public readonly channel: string,
    public readonly customerName: string,
    public readonly customerEmail: string,
    public readonly customerPhone: string,
    public readonly commerceName: string,
    public readonly commerceAddress: string,
  ) {}
}
