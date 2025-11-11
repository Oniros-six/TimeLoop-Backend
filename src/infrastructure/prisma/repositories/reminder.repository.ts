import { Injectable } from '@nestjs/common';
import { Reminder as DomainClient } from '@/domain/entities/reminder.entity';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { PrismaService } from '../prisma.service';
import { ReminderStatus } from '@/domain/dbEnums/Reminder.enum';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

type ReminderWithRelations = DomainClient & {
  customer: { name: string; email: string; phone: string };
  commerce: { id: number; name: string; address: string };
};

@Injectable()
export class PrismaReminderRepository implements IReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDTO(reminder: ReminderWithRelations): ReminderDTO {
    return new ReminderDTO(
      reminder.id,
      reminder.bookingId,
      reminder.commerceId,
      reminder.scheduledAt,
      reminder.channel,
      reminder.customer.name,
      reminder.customer.email,
      reminder.customer.phone,
      reminder.commerce.name,
      reminder.commerce.address,
    );
  }

  async create(reminder: DomainClient): Promise<null> {
    const { id, ...rest } = reminder; // removing id
    const result = await this.prisma.reminder.create({
      data: rest,
    });
    if (!result) return null;
    return null;
  }

  async updateSent(reminderId: number): Promise<void> {
    await this.prisma.reminder.update({
      where: {
        id: reminderId,
      },
      data: {
        status: ReminderStatus.sent,
        sentAt: new Date(),
      },
    });
  }

  async updateReminder(reminder: DomainClient): Promise<void> {
    const data: Partial<DomainClient> = {
      channel: reminder.channel,
      status: ReminderStatus.pending,
    };

    if (reminder.scheduledAt) data.scheduledAt = reminder.scheduledAt;
    await this.prisma.reminder.update({
      where: { bookingId: reminder.bookingId },
      data,
    });
  }

  async findMany(date: Date, windows: Date) {
    const result = await this.prisma.reminder.findMany({
      where: {
        scheduledAt: { gte: date, lte: windows },
        status: ReminderStatus.pending,
      },
      include: {
        customer: true,
        commerce: true,
      },
    });
    return result.map((reminder) => this.toDTO(reminder));
  }

  async cancelReminder(id: number): Promise<void> {
    await this.prisma.reminder.update({
      where: { bookingId: id },
      data: {
        status: ReminderStatus.canceled,
      },
    });
  }
}
