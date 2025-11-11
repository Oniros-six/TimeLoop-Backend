import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/Reminder.enum';
import { Booking } from '@/domain/entities/booking.entity';
import { BookingService } from '@/domain/entities/bookingService.entity';
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
import { BookingHistory } from '@/domain/entities/bookingHistory.entity';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { Prisma } from '@prisma/client';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';

/**
 * ARCHITECTURAL DECISION RECORD (ADR):
 * 
 * Este use case inyecta PrismaService directamente, lo cual técnicamente 
 * viola Clean Architecture (capa de aplicación dependiendo de infraestructura).
 * 
 * JUSTIFICACIÓN PRAGMÁTICA:
 * - Necesitamos atomicidad ACID entre booking, history y activityLog
 * - Prisma requiere acceso directo a $transaction para garantías ACID
 * - Los repositorios individuales no pueden compartir contexto transaccional
 * - La complejidad de implementar Unit of Work no se justifica en esta etapa
 * 
 * TRADE-OFFS ACEPTADOS:
 * ✅ Ganamos: Atomicidad garantizada, código simple, performance óptimo
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

    // NOTA: Ver ADR arriba sobre inyección directa de PrismaService
    private readonly prisma: PrismaService,

    private readonly remindersService: RemindersService,

    private readonly eventEmitter: EventEmitter2,
    private readonly workingPatternValidator: WorkingPatternValidator,
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

    //* 5) TRANSACCIÓN ATÓMICA: booking + history + activityLog
    // NOTA: Ejecutamos directamente en Prisma para garantizar atomicidad ACID.
    // Todos estos cambios DEBEN ser atómicos: si uno falla, se hace rollback de todo.
    // Side effects opcionales (reminders, eventos) van FUERA de la transacción.
    let result: Booking;
    
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // 5.1) Crear booking
        const createdBooking = await tx.booking.create({
          data: {
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

        // 5.2) Crear historial
        const history = BookingHistory.create({
          bookingId: createdBooking.id,
          commerceId: createdBooking.commerceId,
          customerId: createdBooking.customerId,
          userId: createdBooking.userId,
          priceAtBooking: createdBooking.totalPrice,
          durationAtBooking: createdBooking.duration,
          timeStart: createdBooking.timeStart,
          timeEnd: createdBooking.timeEnd,
          status: createdBooking.status,
          notes: createdBooking.notes,
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

        // 5.3) Crear activity log
        const activityLog = ActivityLog.createLog({
          entityType: EntityType.BOOKING,
          entityId: createdBooking.id,
          userId: createdBooking.userId,
          commerceId: createdBooking.commerceId,
          customerId: createdBooking.customerId,
          detail: `Se crea una nueva reserva`,
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
        timeout: 10000, // 10 segundos max
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      // Handle exclusion constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034' || error.message?.includes('unique_user_booking_range')) {
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
        
        if (error.code === 'P2002' && error.message?.includes('idempotencyKey')) {
          this.logger.warn('Duplicate idempotency key detected', {
            idempotencyKey: data.idempotencyKey,
          });
          throw new HttpException(
            'Esta solicitud ya fue procesada',
            HttpStatus.CONFLICT,
          );
        }
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

    return {
      message: 'Su reserva ha sido agendada con éxito.',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
