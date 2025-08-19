import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from '@/domain/services/notifications/notifications.service';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { REMINDER_REPOSITORY } from '@/application/constants/providers';
import { Reminder } from '@/domain/entities/reminder.entity';

@Injectable()
export class RemindersService {

  constructor(
    private notifications: NotificationService,
    @Inject(REMINDER_REPOSITORY)
    private reminderRepository: IReminderRepository,
  ) { }

  @Cron(process.env.REMINDERS_SCHEDULE || '*/30 * * * *') // cada 30 min
  async handleReminders() {

    //establecemos la ventana
    const now = new Date();
    const windows = new Date(now.getTime() + (Number(process.env.REMINDERS_WINDOW) || 60 * 60 * 1000));

    // buscamos los recordatorios
    const reminders = await this.reminderRepository.findMany(now, windows);
    if (!reminders) return;

    // enviamos los datos
    for (const reminder of reminders) {
      await this.notifications.notifyBookingReminder(reminder);
    }
  }

  async create(reminder: Reminder) {
    return this.reminderRepository.create(reminder);
  }

  async update(reminderId: number) {
    return this.reminderRepository.update(reminderId);
  }
}
