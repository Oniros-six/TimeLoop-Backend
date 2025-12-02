import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  BOOKING_REALTIME_NOTIFIER,
} from '@/application/providers';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/Reminder.enum';
import { Booking } from '@/domain/entities/booking.entity';
import { Reminder } from '@/domain/entities/reminder.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { CreateBookingDto } from '@/interfaces/controllers/booking/dto/create-booking.dto';
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ensureNotPast } from '@/domain/value-objects/booking/validations';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { Prisma } from '@prisma/client';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';
import { BookingPersistenceService } from '@/application/services/booking/booking-persistence.service';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

/**
 * ARCHITECTURAL DECISION RECORD (ADR):
 *
 * Este use case delega la persistencia en BookingPersistenceService, el cual
 * utiliza Prisma directamente para garantizar atomicidad ACID entre booking,
 * historial y activity log. Técnicamente sigue violando Clean Architecture
 * (capa de aplicación dependiendo de infraestructura), pero es una decisión
 * pragmática documentada en el ADR 001.
 *
 * TRADE-OFFS ACEPTADOS:
 * ✅ Ganamos: Atomicidad garantizada, código centralizado y simple
 * ⚠️ Perdemos: Pureza arquitectónica, acoplamiento a Prisma
 *
 * REFACTORING FUTURO (cuando escalar lo justifique):
 * Implementar Unit of Work pattern o Transaction Manager para abstraer Prisma.
 *
 * PRIORIDAD: Baja (funciona correctamente, solo deuda técnica arquitectónica)
 */
@Injectable()
export class CreateBooking {
  private readonly logger = new Logger(CreateBooking.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BOOKING_REALTIME_NOTIFIER)
    private readonly bookingRealtimeNotifier: BookingRealtimeNotifier,

    private readonly remindersService: RemindersService,

    private readonly eventEmitter: EventEmitter2,
    private readonly workingPatternValidator: WorkingPatternValidator,
    private readonly bookingPersistenceService: BookingPersistenceService,
  ) {}

  async execute(data: CreateBookingDto) {
    //* 0) Verificar idempotencia
    if (data.idempotencyKey) {
      const existingBooking = await this.bookingRepository.findByIdempotencyKey(
        data.idempotencyKey,
      );

      if (existingBooking) {
        // Ya existe una reserva con esta key, retornar sin crear duplicado
        return {
          message: 'Su reserva ha sido agendada con éxito.',
          statusCode: HttpStatus.OK,
          data: existingBooking,
        };
      }
    }

    //* 1) Validación de fecha y hora
    const scheduledAt = ensureNotPast(data.timeStart);

    //* 2) Validar existencia de los servicios, y que pertenezcan al empleado
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

    //* 3) Validar existencia del usuario y que pertenezca al comercio
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

    //* 4) Crear booking como entidad de dominio
    const booking = Booking.createPending(
      data.customerId,
      data.commerceId,
      data.userId,
      data.timeStart,
      data.notes,
      services,
    );

    await this.workingPatternValidator.ensureAvailability({
      commerceId: booking.commerceId,
      userId: booking.userId,
      timeStart: booking.timeStart,
      timeEnd: booking.timeEnd,
    });

    //* 5) Persistir booking + historial + activity log (transacción atómica)
    let result: Booking;

    try {
      result = await this.bookingPersistenceService.createBookingWithHistory({
        bookingData: {
          customerId: booking.customerId,
          commerceId: booking.commerceId,
          userId: booking.userId,
          timeStart: booking.timeStart,
          timeEnd: booking.timeEnd,
          duration: booking.duration,
          totalPrice: booking.totalPrice,
          status: BookingStatus.PENDING,
          notes: booking.notes,
          idempotencyKey: data.idempotencyKey,
          expiresAt: null,
        },
        serviceIds: services.map((service) => service.id),
        activityLogDetail: 'Se crea una nueva reserva',
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
        this.logger.warn('Booking time range overlap detected', {
          userId: data.userId,
          timeStart: data.timeStart,
          timeEnd: booking.timeEnd,
        });
        throw new HttpException(
          'El horario está ocupado (conflicto de reserva simultánea)',
          HttpStatus.CONFLICT,
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        error.message?.includes('idempotencyKey')
      ) {
        this.logger.warn('Duplicate idempotency key detected', {
          idempotencyKey: data.idempotencyKey,
        });
        throw new HttpException(
          'Esta solicitud ya fue procesada',
          HttpStatus.CONFLICT,
        );
      }

      this.logger.error('Error creating booking in transaction', error);
      throw new HttpException(
        'Error al registrar la reserva, intente de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* 6) SIDE EFFECTS OPCIONALES (fuera de transacción con graceful degradation)
    // HYBRID PATTERN: Los side effects no críticos van FUERA de la transacción.
    // Si fallan, solo se loguean pero NO se hace rollback del booking.
    // Esto permite que el booking se complete exitosamente incluso si el servicio
    // de reminders o eventos está caído, mejorando la disponibilidad del sistema.
    
    // 6.1) Crear recordatorio (NO crítico)
    try {
      const reminder = Reminder.create({
        bookingId: result.id,
        customerId: result.customerId,
        commerceId: result.commerceId,
        scheduledAt,
        sentAt: null,
        channel: ReminderChannel.email,
        status: ReminderStatus.pending,
      });

      await this.remindersService.create(reminder);
    } catch (error) {
      this.logger.error('Failed to create reminder (non-critical)', {
        bookingId: result.id,
        error: error instanceof Error ? error.message : error,
      });
      // No lanzamos error, booking ya fue creado exitosamente
    }

    // 6.2) Emitir evento (NO crítico)
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
      // No lanzamos error, booking ya fue creado exitosamente
    }

    // 6.3) Emitir actualización en tiempo real (NO crítico)
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
      // No lanzamos error, booking ya fue creado exitosamente
    }

    return {
      message: 'Su reserva ha sido agendada con éxito.',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
