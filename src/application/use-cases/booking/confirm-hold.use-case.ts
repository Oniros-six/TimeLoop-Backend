import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { Booking } from '@/domain/entities/booking.entity';
import { BookingHistory } from '@/domain/entities/bookingHistory.entity';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import { BookingService } from '@/domain/entities/bookingService.entity';

/**
 * Use Case: Confirmar un hold y convertirlo en reserva PENDING
 * 
 * PROPÓSITO:
 * Cuando el cliente avanza en el flujo de pago, necesitamos convertir el HOLD
 * temporal en una reserva PENDING permanente.
 * 
 * FLUJO:
 * 1. Verificar que el hold existe y no ha expirado (validación crítica)
 * 2. Actualizar status de HOLD a PENDING
 * 3. Limpiar expiresAt (ya no es temporal)
 * 4. Crear historial y activity log (atomicidad ACID)
 * 5. Emitir evento (opcional, con try-catch)
 * 
 * NOTA ARQUITECTÓNICA:
 * Accede directamente a PrismaService para validar 'expiresAt' (campo no
 * presente en modelo de dominio). Decisión pragmática documentada en ADR 001.
 */
@Injectable()
export class ConfirmHold {
  private readonly logger = new Logger(ConfirmHold.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(holdId: number) {
    //* 1) Buscar el hold y verificar expiración en una sola query
    const holdData = await this.prisma.booking.findUnique({
      where: { id: holdId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        customerId: true,
        commerceId: true,
        userId: true,
        timeStart: true,
        timeEnd: true,
        duration: true,
        totalPrice: true,
        notes: true,
        bookingServices: {
          select: {
            bookingId: true,
            serviceId: true,
          },
        },
      },
    });

    if (!holdData) {
      throw new HttpException(
        'Prereserva no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    //* 2) Verificar que es un HOLD
    if (holdData.status !== BookingStatus.HOLD) {
      throw new HttpException(
        `Esta reserva tiene status ${holdData.status}, no puede ser confirmada desde prereserva`,
        HttpStatus.BAD_REQUEST,
      );
    }

    //* 3) Verificar que no ha expirado (validación crítica de negocio)
    if (holdData.expiresAt && holdData.expiresAt < new Date()) {
      this.logger.warn(`Intento de confirmar prereserva expirada: ${holdId}`, {
        expiresAt: holdData.expiresAt,
        now: new Date(),
      });
      throw new HttpException(
        'La prereserva ha expirado. Por favor, seleccione el horario nuevamente.',
        HttpStatus.GONE,
      );
    }

    //* 4) TRANSACCIÓN ATÓMICA: Convertir HOLD a PENDING + history + activityLog
    let result: Booking;

    try {
      result = await this.prisma.$transaction(async (tx) => {
        // 4.1) Actualizar booking: HOLD → PENDING
        const confirmedBooking = await tx.booking.update({
          where: { id: holdId },
          data: {
            status: BookingStatus.PENDING,
            expiresAt: null, // Limpiar expiración, ya es permanente
          },
          include: {
            bookingServices: {
              include: { service: true },
            },
          },
        });

        // 4.2) Crear historial
        const history = BookingHistory.create({
          bookingId: confirmedBooking.id,
          commerceId: confirmedBooking.commerceId,
          customerId: confirmedBooking.customerId,
          userId: confirmedBooking.userId,
          priceAtBooking: confirmedBooking.totalPrice,
          durationAtBooking: confirmedBooking.duration,
          timeStart: confirmedBooking.timeStart,
          timeEnd: confirmedBooking.timeEnd,
          status: confirmedBooking.status,
          notes: confirmedBooking.notes,
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

        // 4.3) Crear activity log
        const activityLog = ActivityLog.createLog({
          entityType: EntityType.BOOKING,
          entityId: confirmedBooking.id,
          userId: confirmedBooking.userId,
          commerceId: confirmedBooking.commerceId,
          customerId: confirmedBooking.customerId,
          detail: `Reserva confirmada (convertida desde hold)`,
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

        // Convertir a entidad de dominio
        return new Booking(
          confirmedBooking.id,
          confirmedBooking.customerId,
          confirmedBooking.commerceId,
          confirmedBooking.duration,
          confirmedBooking.userId,
          confirmedBooking.status as BookingStatus,
          confirmedBooking.timeStart,
          confirmedBooking.timeEnd,
          confirmedBooking.notes,
          confirmedBooking.totalPrice,
          confirmedBooking.bookingServices.map((bs: any) => 
            new BookingService(bs.bookingId || confirmedBooking.id, bs.serviceId)
          ),
        );
      });
    } catch (error) {
      this.logger.error('Error confirming hold', error);
      throw new HttpException(
        'Error al confirmar la reserva',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      this.eventEmitter.emit(
        BOOKING_EVENTS.CREATED,
        new BookingCreatedEvent(result),
      );
    } catch (error) {
      this.logger.error('Failed to emit booking created event (non-critical)', {
        bookingId: result.id,
        error: error instanceof Error ? error.message : error,
      });
    }

    this.logger.log(`Prereserva ${holdId} confirmada exitosamente`);

    return {
      message: 'Reserva confirmada exitosamente',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}

