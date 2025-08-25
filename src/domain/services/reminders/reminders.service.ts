import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { REMINDER_REPOSITORY } from '@/application/providers';
import { Reminder } from '@/domain/entities/reminder.entity';

@Injectable()
export class RemindersService {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private reminderRepository: IReminderRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron(process.env.REMINDERS_SCHEDULE || '0,30 * * * *') // cada 30 min
  async handleReminders() {
    //establecemos la ventana
    const now = new Date();
    const windows = new Date(
      now.getTime() + (Number(process.env.REMINDERS_WINDOW) || 60 * 60 * 1000),
    );

    // buscamos los recordatorios
    const reminders = await this.reminderRepository.findMany(now, windows);
    if (!reminders) return;

    // enviamos los datos
    for (const reminder of reminders) {
      this.eventEmitter.emit('reminder.send', reminder);
    }
  }

  async create(reminder: Reminder) {
    return this.reminderRepository.create(reminder);
  }

  async updateSent(reminderId: number) {
    return this.reminderRepository.updateSent(reminderId);
  }

  async updateReminder(reminder: Reminder) {
    return this.reminderRepository.updateReminder(reminder);
  }

  async cancelReminder(id: number) {
    return this.reminderRepository.cancelReminder(id);
  }
}
