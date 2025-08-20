import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/common/ReminderConstants';

export class Reminder {
  constructor(
    public readonly id: number,
    public readonly bookingId: number,
    public readonly customerId: number,
    public readonly commerceId: number,
    public scheduledAt: Date,
    public sentAt: Date | null,
    public channel: ReminderChannel,
    public status: ReminderStatus,
  ) {}

  // Factory method
  static create(props: {
    id?: number;
    bookingId: number;
    customerId: number;
    commerceId: number;
    scheduledAt: Date;
    sentAt: Date | null;
    channel: ReminderChannel;
    status: ReminderStatus;
  }): Reminder {
    return new Reminder(
      props.id ?? 0,
      props.bookingId,
      props.customerId,
      props.commerceId,
      props.scheduledAt,
      props.sentAt,
      props.channel,
      props.status,
    );
  }
  static update(props: {
    id?: number;
    bookingId: number;
    customerId: number;
    commerceId: number;
    scheduledAt: Date;
    sentAt: Date | null;
    channel: ReminderChannel;
    status: ReminderStatus;
  }): Reminder {
    return new Reminder(
      props.id ?? 0,
      props.bookingId,
      props.customerId,
      props.commerceId,
      props.scheduledAt,
      props.sentAt,
      props.channel,
      props.status,
    );
  }
}
