import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { Booking as DomainClient } from '@/domain/entities/booking.entity';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(booking: {
    id: number;
    customerId: number;
    commerceId: number;
    duration: number;
    userId: number;
    status: BookingStatus;
    serviceId: number;
    timeStart: Date;
    timeEnd: Date;
    notes: string;
  }): DomainClient {
    return new DomainClient(
      booking.id,
      booking.customerId,
      booking.commerceId,
      booking.duration,
      booking.userId,
      booking.status,
      booking.serviceId,
      booking.timeStart,
      booking.timeEnd,
      booking.notes,
    );
  }

  async createSchedule(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (prisma) => {
      return await prisma.booking.create({
        data: {
          timeStart: data.timeStart,
          timeEnd: data.timeEnd,
          duration: data.duration,
          status: data.status,
          customerId: data.customerId,
          serviceId: data.serviceId,
          commerceId: data.commerceId,
          userId: data.userId,
          notes: data.notes,
        },
      });
    });
    if (!result) return null;

    return this.toDomain(result);
  }

  async findOverlapping(data: {
    id?: number;
    timeEnd: Date;
    timeStart: Date;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findFirst({
      where: {
        id: { not: data.id },
        commerceId: data.commerceId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.RESCHEDULED],
        },
        AND: [
          { timeStart: { lt: data.timeEnd } },  // startDB < endNew
          { timeEnd: { gt: data.timeStart } },  // endDB > startNew
        ],
      },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async findBusy(data: {
    timeStart: Date;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findFirst({
      where: {
        timeStart: data.timeStart,
        commerceId: data.commerceId,
        status: BookingStatus.CONFIRMED,
      },
    });
    if (!result) return null;

    return this.toDomain(result);
  }

  async findAllByCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.booking.findMany({
      where: {
        commerceId: data.commerceId,
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findAllByDateAndCommerce(data: {
    commerceId: number;
    timeStart: Date;
  }): Promise<DomainClient[] | null> {
    const date = data.timeStart;

    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    const result = await this.prisma.booking.findMany({
      where: {
        timeStart: {
          gte: start,
          lte: end,
        },
        commerceId: data.commerceId,
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findBusySlots(data: {
    commerceId: number;
    timeStart: Date;
  }): Promise<DomainClient[] | null> {
    const date = data.timeStart;

    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    const result = await this.prisma.booking.findMany({
      where: {
        timeStart: {
          gte: start,
          lte: end,
        },
        commerceId: data.commerceId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.RESCHEDULED],
        },
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findOne(data: { id: number }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findUnique({
      where: { id: data.id },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async cancelSchedule(data: { id: number }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.booking.update({
        where: { id: data.id },
        data: {
          status: BookingStatus.CANCELED,
        },
      });
    });

    if (!result) return null;

    return this.toDomain(result);
  }

  async updateSchedule(data: {
    id: number;
    dataToUpdate: BookingUpdateData;
  }): Promise<DomainClient | null> {
    data.dataToUpdate.status = BookingStatus.CONFIRMED;
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.booking.update({
        where: { id: data.id },
        data: data.dataToUpdate,
      });
    });

    if (!result) return null;

    return this.toDomain(result);
  }
}
