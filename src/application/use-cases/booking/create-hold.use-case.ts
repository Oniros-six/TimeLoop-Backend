import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  BOOKING_REALTIME_NOTIFIER,
} from '@/application/providers';
import { Booking } from '@/domain/entities/booking.entity';
import { BookingService } from '@/domain/entities/bookingService.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ensureNotPast } from '@/domain/value-objects/booking/validations';
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { Prisma } from '@prisma/client';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';
import { CreateHoldDto } from '@/interfaces/controllers/booking/dto/create-hold.dto';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

/**
 * Use Case: Crear un "hold" temporal de 5 minutos
 * 
 * PROPÓSITO:
 * Cuando un cliente selecciona un horario y va a completar el proceso de checkout,
 * necesitamos "reservar" ese horario temporalmente para evitar que otro usuario
 * lo tome mientras completa todo el proceso (puede pagar o no).
 * 
 * FLUJO:
 * 1. Cliente selecciona horario → Se crea HOLD (5 min)
 * 2. Cliente completa proceso de checkout → HOLD se convierte a PENDING (via confirm-hold)
 * 3. Si el pago se confirma → PENDING se convierte a CONFIRMED (via webhook)
 * 4. Cliente abandona → Cron limpia el HOLD después de 5 min
 * 
 * INTEGRACIÓN CON WEBSOCKETS:
 * Cuando se crea/libera un hold, se emite evento para actualizar disponibilidad
 * en tiempo real para otros usuarios viendo el mismo día.
 */
@Injectable()
export class CreateHold {
  private readonly logger = new Logger(CreateHold.name);
  private readonly HOLD_EXPIRATION_MINUTES = 5;

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BOOKING_REALTIME_NOTIFIER)
    private readonly bookingRealtimeNotifier: BookingRealtimeNotifier,

    private readonly prisma: PrismaService,
    private readonly workingPatternValidator: WorkingPatternValidator,
  ) {}

  async execute(data: CreateHoldDto) {
    //* 0) Verificar idempotencia (si la prereserva ya existe, reutilizarla)
    if (data.idempotencyKey) {
      const existingBooking = await this.bookingRepository.findByIdempotencyKey(
        data.idempotencyKey,
      );

      if (existingBooking) {
        const message = existingBooking.status === BookingStatus.HOLD
          ? 'La prereserva ya estaba registrada. Puedes continuar con el pago.'
          : 'Esta solicitud ya fue procesada previamente.';

        return {
          message,
          statusCode: HttpStatus.OK,
          data: existingBooking,
        };
      }
    }

    //* 1) Validación de fecha y hora
    const validatedTimeStart = ensureNotPast(data.timeStart);

    //* 2) Validar existencia de los servicios
    const services = await this.serviceRepository.findServicesByUser({
      serviceIds: data.serviceIds,
      userId: data.userId,
    });

    if (!services || services.length !== data.serviceIds.length) {
      throw new HttpException(
        'Al menos uno de los servicios no pertenece al empleado especificado',
        HttpStatus.NOT_FOUND,
      );
    }

    //* 3) Validar existencia del usuario
    const user = await this.userRepository.findUserByCommerce({
      userId: data.userId,
      commerceId: data.commerceId,
    });

    if (!user) {
      throw new HttpException(
        'El usuario no existe o no pertenece al comercio especificado',
        HttpStatus.NOT_FOUND,
      );
    }

    //* 4) Crear booking como entidad de dominio con status HOLD
    const booking = Booking.createPending(
      data.customerId,
      data.commerceId,
      data.userId,
      validatedTimeStart,
      data.notes || 'Prereserva temporal',
      services,
    );

    await this.workingPatternValidator.ensureAvailability({
      commerceId: booking.commerceId,
      userId: booking.userId,
      timeStart: booking.timeStart,
      timeEnd: booking.timeEnd,
    });

    //* 5) Calcular expiración (5 minutos desde ahora)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.HOLD_EXPIRATION_MINUTES);

    //* 6) Crear HOLD en BD (validación de solapamiento via exclusion constraint)
    let result: Booking;

    try {
      result = await this.prisma.$transaction(async (tx) => {
        const createdBooking = await tx.booking.create({
          data: {
            customerId: booking.customerId,
            commerceId: booking.commerceId,
            userId: booking.userId,
            timeStart: booking.timeStart,
            timeEnd: booking.timeEnd,
            duration: booking.duration,
            totalPrice: booking.totalPrice,
            status: BookingStatus.HOLD,
            notes: booking.notes,
            expiresAt: expiresAt,
            idempotencyKey: data.idempotencyKey ?? null,
            bookingServices: {
              create: services.map((service) => ({
                serviceId: service.id,
              })),
            },
          },
          include: {
            bookingServices: {
              include: { service: true },
            },
          },
        });

        // Convertir a entidad de dominio
        return new Booking(
          createdBooking.id,
          createdBooking.customerId,
          createdBooking.commerceId,
          createdBooking.duration,
          createdBooking.userId,
          createdBooking.status as BookingStatus,
          createdBooking.timeStart,
          createdBooking.timeEnd,
          createdBooking.notes,
          createdBooking.totalPrice,
          createdBooking.bookingServices.map((bs: any) => 
            new BookingService(bs.bookingId || createdBooking.id, bs.serviceId)
          ),
        );
      }, {
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
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
        this.logger.warn('Horario no disponible (ocupado o en prereserva)', {
          userId: data.userId,
          timeStart: data.timeStart,
          timeEnd: booking.timeEnd,
        });
        throw new HttpException(
          'El horario ya no está disponible. Intenta con otro horario.',
          HttpStatus.CONFLICT,
        );
      }

      this.logger.error('Error creating hold', error);
      throw new HttpException(
        'Error al reservar el horario temporalmente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.log(`Hold created: ${result.id}, expires at ${expiresAt.toISOString()}`);

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
      // No lanzamos error, hold ya fue creado exitosamente
    }

    return {
      message: 'Horario prereservado. Complete el checkout en 5 minutos.',
      statusCode: HttpStatus.CREATED,
      data: {
        holdId: result.id,
        expiresAt: expiresAt,
        expiresInSeconds: this.HOLD_EXPIRATION_MINUTES * 60,
      },
    };
  }
}