import { Reminder } from '@/domain/entities/reminder.entity';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

export interface IReminderRepository {
  create(reminder: Reminder): Promise<null>;
  updateSent(id: number): Promise<void>;
  updateReminder(reminder: Reminder): Promise<void>;
  findMany(date: Date, windows: Date): Promise<ReminderDTO[] | null>;
  cancelReminder(id: number): Promise<void>;
}
