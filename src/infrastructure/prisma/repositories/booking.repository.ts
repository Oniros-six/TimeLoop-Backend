import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { Booking as DomainClient } from '@/domain/entities/booking.entity';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { BookingService } from '@/domain/entities/bookingService.entity';
import { BookingDetail } from '@/domain/common/BookingDetail.type';
import { BookingMP } from '@/domain/common/BookingMP.type';

const today = new Date();
today.setHours(0, 0, 0, 0);

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

      await this.prisma.customerCommerce.upsert({
        where: {
          customerId_commerceId: {
            customerId: data.customerId,
            commerceId: data.commerceId,
          },
        },
        update: {
          // si ya existe, podrías actualizar "lastReservationAt" o "totalReservations"
        },
        create: {
          customerId: data.customerId,
          commerceId: data.commerceId,
          firstReservationAt: new Date(),
        },
      });

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
            create: data.bookingServices.map((bs) => ({
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
    userId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findFirst({
      where: {
        id: { not: data.id },
        userId: data.userId,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.RESCHEDULED,
          ],
        },
        AND: [
          { timeStart: { lt: data.timeEnd } }, // startDB < endNew
          { timeEnd: { gt: data.timeStart } }, // endDB > startNew
        ],
      },
      include: {
        bookingServices: true,
      },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async findBusy(data: {
    timeStart: Date;
    userId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.booking.findFirst({
      where: {
        timeStart: data.timeStart,
        userId: data.userId,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        bookingServices: true,
      },
    });
    if (!result) return null;

    return this.toDomain(result);
  }

  async findAllByUser(data: { userId: number; limit?: number; cursor?: number }): Promise<{
    items: BookingDetail[];
    nextCursor: number | null;
    hasNextPage: boolean;
  }> {
    const { userId, limit = 10, cursor } = data;

    const result = await this.prisma.booking.findMany({
      take: limit + 1, // pedimos uno más para saber si hay siguiente página
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      where: {
        userId,
        status: {
          notIn: [BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
        },
        timeStart: {
          gte: today,
        },
      },
      orderBy: { timeStart: 'asc' },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        bookingServices: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Si obtuvimos más del límite, hay otra página
    const hasNextPage = result.length > limit;
    const trimmed = hasNextPage ? result.slice(0, limit) : result;

    const mapped = trimmed.map((b) => {
      const booking = this.toDomain(b);
      return {
        ...booking,
        customer: b.customer,
        user: b.user,
        services: b.bookingServices.map((bs) => bs.service),
      } as BookingDetail;
    });

    const nextCursor = hasNextPage ? trimmed[trimmed.length - 1].id : null;

    return {
      items: mapped,
      nextCursor,
      hasNextPage,
    };
  }

  async findAllByCommerce(data: { commerceId: number; limit?: number; cursor?: number }): Promise<{
    items: BookingDetail[];
    nextCursor: number | null;
    hasNextPage: boolean;
  }> {
    const { commerceId, limit = 10, cursor } = data;

    const result = await this.prisma.booking.findMany({
      take: limit + 1, // pedimos uno más para saber si hay siguiente página
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      where: {
        commerceId,
        status: {
          notIn: [BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
        },
        timeStart: {
          gte: today,
        },
      },
      orderBy: { timeStart: 'asc' },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        bookingServices: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Si obtuvimos más del límite, hay otra página
    const hasNextPage = result.length > limit;
    const trimmed = hasNextPage ? result.slice(0, limit) : result;

    const mapped = trimmed.map((b) => {
      const booking = this.toDomain(b);
      return {
        ...booking,
        customer: b.customer,
        user: b.user,
        services: b.bookingServices.map((bs) => bs.service),
      } as BookingDetail;
    });

    const nextCursor = hasNextPage ? trimmed[trimmed.length - 1].id : null;

    return {
      items: mapped,
      nextCursor,
      hasNextPage,
    };
  }
  async findAllByDateAndUser(data: {
    userId: number;
    timeStart: Date;
  }): Promise<DomainClient[] | null> {
    // PostgreSQL con TIMESTAMPTZ maneja UTC automáticamente
    // Solo necesitamos definir el rango del día en UTC
    const startOfDay = new Date(data.timeStart);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data.timeStart);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await this.prisma.booking.findMany({
      where: {
        timeStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        userId: data.userId,
      },
      include: {
        bookingServices: true,
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((booking) => this.toDomain(booking));
  }

  async findBusySlots(data: {
    userId: number;
    timeStart: Date;
  }): Promise<DomainClient[] | null> {
    // PostgreSQL con TIMESTAMPTZ maneja UTC automáticamente
    const startOfDay = new Date(data.timeStart);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data.timeStart);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await this.prisma.booking.findMany({
      where: {
        timeStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        userId: data.userId,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.RESCHEDULED,
          ],
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

  async findBookingData(bookingId: number): Promise<BookingMP> {
    const result = await this.prisma.booking.findFirstOrThrow({
      where: { id: bookingId },
      include: {
        commerce: true,
        customer: true, // Para traer datos del cliente
      },
    });

    return {
      id: result.id,
      customer: result.customer,
      commerce: result.commerce,
    };
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
        where: { bookingId: data.id },
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
            create: data.dataToUpdate.serviceIds.map((bs) => ({
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
