import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Booking } from '@/domain/entities/booking.entity';
import { BookingService as BookingServiceEntity } from '@/domain/entities/bookingService.entity';
import { BookingHistory } from '@/domain/entities/bookingHistory.entity';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';

interface CreateBookingTransactionInput {
  bookingData: {
    customerId: number;
    commerceId: number;
    userId: number;
    timeStart: Date;
    timeEnd: Date;
    duration: number;
    totalPrice: number;
    status: BookingStatus;
    notes: string;
    idempotencyKey?: string;
    expiresAt?: Date | null;
  };
  serviceIds: number[];
  activityLogDetail: string;
}

interface UpdateBookingTransactionInput {
  bookingId: number;
  bookingData: {
    status?: BookingStatus;
    timeStart?: Date;
    timeEnd?: Date;
    duration?: number;
    totalPrice?: number;
    notes?: string;
    expiresAt?: Date | null;
  };
  resetServices?: boolean;
  serviceIds?: number[];
  activityLogDetail: string;
}

type PrismaBookingWithServices = Prisma.BookingGetPayload<{
  include: {
    bookingServices: {
      include: {
        service: true;
      };
    };
  };
}>;

@Injectable()
export class BookingPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async createBookingWithHistory(
    input: CreateBookingTransactionInput,
  ): Promise<Booking> {
    const result = await this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          customerId: input.bookingData.customerId,
          commerceId: input.bookingData.commerceId,
          userId: input.bookingData.userId,
          timeStart: input.bookingData.timeStart,
          timeEnd: input.bookingData.timeEnd,
          duration: input.bookingData.duration,
          totalPrice: input.bookingData.totalPrice,
          status: input.bookingData.status,
          notes: input.bookingData.notes,
          idempotencyKey: input.bookingData.idempotencyKey,
          expiresAt: input.bookingData.expiresAt ?? null,
          bookingServices: {
            create: input.serviceIds.map((serviceId) => ({ serviceId })),
          },
        },
        include: {
          bookingServices: {
            include: { service: true },
          },
        },
      });

      await this.createHistoryRecord(tx, createdBooking);
      await this.createActivityLog(tx, createdBooking, input.activityLogDetail);

      return createdBooking;
    });

    return this.mapToDomain(result);
  }

  async updateBookingWithHistory(
    input: UpdateBookingTransactionInput,
  ): Promise<Booking> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Revalidar que el booking existe antes de actualizar
      // Esto previene race conditions (ej: cron eliminó el hold)
      const existingBooking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        select: { id: true, status: true },
      });

      if (!existingBooking) {
        throw new Error(`Booking ${input.bookingId} not found`);
      }

      if (input.resetServices) {
        await tx.bookingService.deleteMany({ where: { bookingId: input.bookingId } });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: input.bookingData.status,
          timeStart: input.bookingData.timeStart,
          timeEnd: input.bookingData.timeEnd,
          duration: input.bookingData.duration,
          totalPrice: input.bookingData.totalPrice,
          notes: input.bookingData.notes,
          expiresAt: input.bookingData.expiresAt ?? null,
          bookingServices: input.serviceIds
            ? {
                create: input.serviceIds.map((serviceId) => ({ serviceId })),
              }
            : undefined,
        },
        include: {
          bookingServices: {
            include: { service: true },
          },
        },
      });

      await this.createHistoryRecord(tx, updatedBooking);
      await this.createActivityLog(tx, updatedBooking, input.activityLogDetail);

      return updatedBooking;
    });

    return this.mapToDomain(result);
  }

  private async createHistoryRecord(
    tx: Prisma.TransactionClient,
    booking: PrismaBookingWithServices,
  ) {
    const history = BookingHistory.create({
      bookingId: booking.id,
      commerceId: booking.commerceId,
      customerId: booking.customerId,
      userId: booking.userId,
      priceAtBooking: booking.totalPrice,
      durationAtBooking: booking.duration,
      timeStart: booking.timeStart,
      timeEnd: booking.timeEnd,
      status: booking.status,
      notes: booking.notes,
    });

    await tx.bookingHistory.create({
      data: {
        bookingId: history.bookingId,
        commerceId: history.commerceId,
        userId: history.userId,
        customerId: history.customerId,
        priceAtBooking: history.priceAtBooking,
        durationAtBooking: history.durationAtBooking,
        timeStart: history.timeStart,
        timeEnd: history.timeEnd,
        status: history.status,
        notes: history.notes,
      },
    });
  }

  private async createActivityLog(
    tx: Prisma.TransactionClient,
    booking: PrismaBookingWithServices,
    detail: string,
  ) {
    const activityLog = ActivityLog.createLog({
      entityType: EntityType.BOOKING,
      entityId: booking.id,
      userId: booking.userId,
      commerceId: booking.commerceId,
      customerId: booking.customerId,
      detail,
    });

    await tx.activityLog.create({
      data: {
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        changeType: activityLog.changeType,
        detail: activityLog.detail,
        userId: activityLog.userId,
        commerceId: activityLog.commerceId,
        customerId: activityLog.customerId,
        timestamp: activityLog.timestamp,
      },
    });
  }

  private mapToDomain(booking: PrismaBookingWithServices): Booking {
    return new Booking(
      booking.id,
      booking.customerId,
      booking.commerceId,
      booking.duration,
      booking.userId,
      booking.status as BookingStatus,
      booking.timeStart,
      booking.timeEnd,
      booking.notes,
      booking.totalPrice,
      booking.bookingServices.map(
        (service) => new BookingServiceEntity(service.bookingId, service.serviceId),
      ),
    );
  }
}
