import { Reminder } from '@/domain/entities/reminder.entity';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

export interface IReminderRepository {
  create(reminder: Reminder): Promise<null>;
  update(id: number): Promise<void>;
  findMany(date: Date, windows: Date): Promise<ReminderDTO[] | null>;
}
