import { Injectable } from '@nestjs/common';
import { Reminder as DomainClient } from '@/domain/entities/reminder.entity';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { PrismaService } from '../prisma.service';
import { ReminderStatus } from '@/domain/common/ReminderConstants';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

type ReminderWithRelations = DomainClient & {
  customer: { name: string; email: string; phone: string };
  commerce: { name: string; address: string };
};

@Injectable()
export class PrismaReminderRepository implements IReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDTO(reminder: ReminderWithRelations): ReminderDTO {
    return new ReminderDTO(
      reminder.id,
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
    const result = await this.prisma.reminder.create({
      data: reminder,
    });
    if (!result) return null;
    return null;
  }

  async update(reminderId: number): Promise<void> {
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
}
