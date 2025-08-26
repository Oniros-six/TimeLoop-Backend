import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { Booking as DomainClient } from '@/domain/entities/booking.entity';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { BookingService } from '@/domain/entities/bookingService.entity';

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
    bookingServices: BookingService[];
    timeStart: Date;
    timeEnd: Date;
    totalPrice: number;
    notes: string;
  }): DomainClient {
    return new DomainClient(
      booking.id,
      booking.customerId,
      booking.commerceId,
      booking.duration,
      booking.userId,
      booking.status,
      booking.timeStart,
      booking.timeEnd,
      booking.notes,
      booking.totalPrice,
      booking.bookingServices,
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
          commerceId: data.commerceId,
          userId: data.userId,
          notes: data.notes,
          totalPrice: data.totalPrice,
          bookingServices: {
            create: data.bookingServices.map(bs => ({
              serviceId: bs.serviceId,
            })),
          },
        },
        include: {
          bookingServices: {
            include: {
              service: true,
            },
          },
        },
      });
    });

    if (!result) return null;

    return this.toDomain(result); // tu función para mapear a entidad de dominio
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
      }, include: {
        bookingServices: true,
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
      include: {
        bookingServices: true,
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
      include: {
        bookingServices: true,
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
      include: {
        bookingServices: true,
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
      include: {
        bookingServices: true,
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findOne(data: { id: number }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findUnique({
      where: { id: data.id },
      include: {
        bookingServices: true,
      },
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
        include: {
          bookingServices: true,
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

    const result = await this.prisma.$transaction(async (tx) => {

      // Borrar los servicios antiguos
      await tx.bookingService.deleteMany({
        where: { bookingId: data.id }
      });

      // Actualizar la reserva y crear los nuevos bookingServices
      return await tx.booking.update({
        where: { id: data.id },
        data: {
          timeStart: data.dataToUpdate.timeStart,
          timeEnd: data.dataToUpdate.timeEnd,
          duration: data.dataToUpdate.duration,
          status: BookingStatus.RESCHEDULED,
          userId: data.dataToUpdate.userId,
          notes: data.dataToUpdate.notes,
          totalPrice: data.dataToUpdate.totalPrice,
          bookingServices: {
            create: data.dataToUpdate.serviceIds.map(bs => ({
              serviceId: bs.serviceId,
            })),
          },
        },
        include: {
          bookingServices: {
            include: { service: true },
          },
        },
      });

    });

    if (!result) return null;
    return this.toDomain(result);
  }

}