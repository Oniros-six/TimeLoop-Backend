import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { Booking as DomainClient } from '@/domain/entities/booking.entity';
import { BookingStatus } from '@/domain/value-objects/booking/booking-status.vo';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(booking: {
    id: number;
    customerId: number;
    commerceId: number;
    duration: number;
    statusId: number;
    serviceId: number;
    date: Date;
    timeStart: Date;
    notes: string;
  }): DomainClient {
    return new DomainClient(
      booking.id,
      booking.customerId,
      booking.commerceId,
      booking.duration,
      BookingStatus.fromDatabaseId(booking.statusId),
      booking.serviceId,
      new BookingDate(booking.date),
      new BookingTime(booking.timeStart),
      booking.notes,
    );
  }

  async createSchedule(data: {
    customerId: number;
    serviceId: number;
    commerceId: number;
    date: Date;
    timeStart: Date;
    duration: number;
    notes: string | undefined;
  }): Promise<DomainClient | null> {
    const booking = DomainClient.createPending(
      data.customerId,
      data.serviceId,
      data.commerceId,
      data.date,
      data.timeStart,
      data.duration,
      data.notes,
    );

    const result = await this.prisma.$transaction(async (prisma) => {
      return await prisma.booking.create({
        data: {
          date: booking.date.value,
          timeStart: booking.timeStart.value,
          timeEnd: booking.timeEnd.value,
          duration: booking.duration,
          statusId: booking.status.getDatabaseId(),
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          commerceId: booking.commerceId,
          notes: booking.notes,
        },
      });
    });
    if (!result) return null;

    return this.toDomain(result);
  }

  async findOverlapping(data: {
    startTime: Date;
    endTime: Date;
    date: Date;
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.booking.findMany({
      where: {
        commerceId: data.commerceId,
        date: data.date,
        timeStart: { lt: data.endTime },
        timeEnd: { gt: data.startTime },
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findBusy(data: {
    date: Date;
    timeStart: Date;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const statusConfirmed = BookingStatus.getConfirmed().getDatabaseId();
    const result = await this.prisma.booking.findFirst({
      where: {
        date: data.date,
        timeStart: data.timeStart,
        commerceId: data.commerceId,
        statusId: statusConfirmed,
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
    date: string;
  }): Promise<DomainClient[] | null> {
    const rawDate = data.date;
    const start = new Date(`${rawDate}T00:00:00.000Z`);
    const end = new Date(`${rawDate}T23:59:59.999Z`);
    const result = await this.prisma.booking.findMany({
      where: {
        date: {
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
    date: string;
  }): Promise<DomainClient[] | null> {
    const rawDate = data.date;
    const start = new Date(`${rawDate}T00:00:00.000Z`);
    const end = new Date(`${rawDate}T23:59:59.999Z`);
    const statusConfirmed = BookingStatus.getConfirmed().getDatabaseId();
    const statusPending = BookingStatus.getPending().getDatabaseId();
    const statusRescheduled = BookingStatus.getRescheduled().getDatabaseId();
    const result = await this.prisma.booking.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        commerceId: data.commerceId,
        statusId: {
          in: [statusConfirmed, statusPending, statusRescheduled],
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
    const cancelStatus = BookingStatus.getCancelled().getDatabaseId();

    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.booking.update({
        where: { id: data.id },
        data: {
          statusId: cancelStatus,
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
    const updateStatus = BookingStatus.getConfirmed().getDatabaseId();
    data.dataToUpdate.statusId = updateStatus;

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
