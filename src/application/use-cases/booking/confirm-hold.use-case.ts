import { Booking } from '@/domain/entities/booking.entity';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import { BookingPersistenceService } from '@/application/services/booking/booking-persistence.service';

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
    private readonly bookingPersistenceService: BookingPersistenceService,
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

    //* 4) Persistir cambios (transacción atómica)
    let result: Booking;

    try {
      result = await this.bookingPersistenceService.updateBookingWithHistory({
        bookingId: holdId,
        bookingData: {
          status: BookingStatus.PENDING,
          expiresAt: null,
        },
        activityLogDetail: 'Reserva confirmada (convertida desde prereserva)',
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

