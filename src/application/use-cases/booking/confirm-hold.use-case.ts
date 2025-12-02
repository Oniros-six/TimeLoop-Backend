import { Booking } from '@/domain/entities/booking.entity';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { HttpException, HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import { BookingPersistenceService } from '@/application/services/booking/booking-persistence.service';
import { BOOKING_REALTIME_NOTIFIER } from '@/application/providers';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

/**
 * Use Case: Confirmar un hold y convertirlo en reserva PENDING
 * 
 * PROPÓSITO:
 * Cuando el cliente completa todo el proceso de checkout (independientemente
 * de si pagó o no), necesitamos convertir el HOLD temporal en una reserva
 * PENDING permanente.
 * 
 * FLUJO:
 * 1. Verificar que el hold existe
 * 2. Validar que el customerId coincide con el que creó el hold (seguridad)
 * 3. Verificar que es un HOLD y no ha expirado (validación crítica)
 * 4. Actualizar status de HOLD a PENDING (en transacción con isolation Serializable)
 *    - El constraint de exclusión GIST previene solapamientos automáticamente
 * 5. Limpiar expiresAt (ya no es temporal)
 * 6. Crear historial y activity log (atomicidad ACID)
 * 7. Emitir evento (opcional, con try-catch)
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

    @Inject(BOOKING_REALTIME_NOTIFIER)
    private readonly bookingRealtimeNotifier: BookingRealtimeNotifier,
  ) {}

  async execute(holdId: number, customerId: number) {
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

    //* 2) Verificar que el customerId coincide (validación de seguridad)
    if (holdData.customerId !== customerId) {
      this.logger.warn(`Intento de confirmar prereserva de otro cliente: ${holdId}`, {
        holdCustomerId: holdData.customerId,
        requestCustomerId: customerId,
      });
      throw new HttpException(
        'No tiene permisos para confirmar esta prereserva. Solo el cliente que la creó puede confirmarla.',
        HttpStatus.FORBIDDEN,
      );
    }

    //* 3) Verificar que es un HOLD
    if (holdData.status !== BookingStatus.HOLD) {
      throw new HttpException(
        `Esta reserva tiene status ${holdData.status}, no puede ser confirmada desde prereserva`,
        HttpStatus.BAD_REQUEST,
      );
    }

    //* 4) Verificar que no ha expirado (validación crítica de negocio)
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

    //* 5) Persistir cambios (transacción atómica con isolation Serializable)
    // El constraint de exclusión GIST previene solapamientos automáticamente
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
      // Manejar error de constraint de exclusión (previene solapamientos)
      const isOverlapError =
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.message?.includes('unique_user_booking_range'))) ||
        (error instanceof Prisma.PrismaClientUnknownRequestError &&
          error.message?.includes('unique_user_booking_range')) ||
        (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error.message === 'string' &&
          error.message.includes('unique_user_booking_range'));

      if (isOverlapError) {
        this.logger.warn('Solapamiento detectado por constraint al confirmar hold', {
          holdId,
          userId: holdData.userId,
          timeStart: holdData.timeStart,
          timeEnd: holdData.timeEnd,
        });
        throw new HttpException(
          'El horario ya no está disponible. Otro usuario ha reservado este horario.',
          HttpStatus.CONFLICT,
        );
      }

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

    //* 7) Emitir actualización en tiempo real (NO crítico)
    try {
      await this.bookingRealtimeNotifier.emitAvailabilityUpdate(
        new AvailabilityUpdateEventDto({
          bookingId: result.id,
          status: result.status,
          timeStart: result.timeStart,
          timeEnd: result.timeEnd,
          employeeId: result.userId,
          commerceId: result.commerceId,
        })
      );
    } catch (error) {
      this.logger.error('Failed to emit realtime update (non-critical)', {
        bookingId: result.id,
        error: error instanceof Error ? error.message : error,
      });
      // No lanzamos error, hold ya fue confirmado exitosamente
    }

    this.logger.log(`Prereserva ${holdId} confirmada exitosamente`);

    return {
      message: 'Reserva confirmada exitosamente',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}

