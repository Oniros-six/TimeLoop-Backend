import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { BookingHistory as DomainClient } from '@/domain/entities/bookingHistory.entity';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { BookingHistoryUpdateData } from '@/domain/common/BookingHistoryUpdateData';

@Injectable()
export class PrismaBookingHistoryRepository
  implements IBookingHistoryRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(bookingHistory: {
    id: number;
    bookingId: number;
    commerceId: number;
    customerId: number;
    userId: number;
    priceAtBooking: number;
    durationAtBooking: number;
    timeStart: Date;
    timeEnd: Date;
    status: BookingStatus;
    notes: string;
  }): DomainClient {
    return new DomainClient(
      bookingHistory.id,
      bookingHistory.bookingId,
      bookingHistory.commerceId,
      bookingHistory.customerId,
      bookingHistory.userId,
      bookingHistory.priceAtBooking,
      bookingHistory.durationAtBooking,
      bookingHistory.timeStart,
      bookingHistory.timeEnd,
      bookingHistory.status,
      bookingHistory.notes,
    );
  }

  async findByCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.bookingHistory.findMany({
      where: { commerceId: data.commerceId },
    });

    if (!result || result.length === 0) return null;
    return result.map((bh) => this.toDomain(bh));
  }

  async findByUser(data: { userId: number }): Promise<DomainClient[] | null> {
    const result = await this.prisma.bookingHistory.findMany({
      where: { userId: data.userId },
    });

    if (!result || result.length === 0) return null;
    return result.map((bh) => this.toDomain(bh));
  }

  async findByDates(data: {
    startDate: Date;
    endDate: Date;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.bookingHistory.findMany({
      where: {
        AND: [
          { timeStart: { lte: data.endDate } },
          { timeEnd: { gte: data.startDate } },
        ],
      },
    });

    if (!result || result.length === 0) return null;
    return result.map((bh) => this.toDomain(bh));
  }

  async findByDatesAndCommerce(data: {
    commerceId: number;
    startDate: Date;  
    endDate: Date;
  }): Promise<DomainClient[]> {
    const result = await this.prisma.bookingHistory.findMany({
      where: {
        commerceId: data.commerceId,
        AND: [
          { timeStart: { lte: data.endDate } },
          { timeEnd: { gte: data.startDate } },
        ],
      },
    });

    return result.map((bh) => this.toDomain(bh));
  }

  async findByDatesAndUser(data: {
    userId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<DomainClient[]> {
    const result = await this.prisma.bookingHistory.findMany({
      where: {
        userId: data.userId,
        AND: [
          { timeStart: { lte: data.endDate } },
          { timeEnd: { gte: data.startDate } },
        ],
      },
    });
    return result.map((bh) => this.toDomain(bh));
  }

  async create(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (prisma) => {
      return await prisma.bookingHistory.create({
        data: {
          bookingId: data.bookingId,
          commerceId: data.commerceId,
          userId: data.userId,
          customerId: data.customerId,
          priceAtBooking: data.priceAtBooking,
          durationAtBooking: data.durationAtBooking,
          timeStart: data.timeStart,
          timeEnd: data.timeEnd,
          status: data.status,
          notes: data.notes,
        },
      });
    });

    if (!result) return null;

    return this.toDomain(result);
  }

  async update(data: {
    id: number;
    history: BookingHistoryUpdateData;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.bookingHistory.update({
        where: { bookingId: data.id },
        data: {
          timeStart: data.history.timeStart,
          timeEnd: data.history.timeEnd,
          durationAtBooking: data.history.durationAtBooking,
          status: BookingStatus.RESCHEDULED,
          userId: data.history.userId,
          notes: data.history.notes,
          priceAtBooking: data.history.priceAtBooking,
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }
}
