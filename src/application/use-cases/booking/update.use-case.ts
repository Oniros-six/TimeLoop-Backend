import {
  BOOKING_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  BOOKING_REALTIME_NOTIFIER,
} from '@/application/providers';
import { BookingRescheduledEvent } from '@/domain/common/booking.events';
import { BookingUpdateData } from '@/domain/common/BookingUpdateData';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import {
  ReminderChannel,
  ReminderStatus,
} from '@/domain/dbEnums/Reminder.enum';
import { BookingService } from '@/domain/entities/bookingService.entity';
import { Reminder } from '@/domain/entities/reminder.entity';
import { Service } from '@/domain/entities/service.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import {
  addMinutesToTime,
  ensureNotPast,
} from '@/domain/value-objects/booking/validations';
import { UpdateBookingDto } from '@/interfaces/controllers/booking/dto/update-booking.dto';
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { ActivityLog } from '@/domain/entities/activityLog.entity';
import { Booking } from '@/domain/entities/booking.entity';
import { Prisma } from '@prisma/client';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

/**
 * ARCHITECTURAL DECISION RECORD (ADR):
 * 
 * Este use case inyecta PrismaService directamente, lo cual técnicamente 
 * viola Clean Architecture (capa de aplicación dependiendo de infraestructura).
 * 
 * JUSTIFICACIÓN PRAGMÁTICA:
 * - Necesitamos atomicidad ACID entre booking update, history y activityLog
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
export class UpdateBooking {
  private readonly logger = new Logger(UpdateBooking.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    @Inject(BOOKING_REALTIME_NOTIFIER)
    private readonly bookingRealtimeNotifier: BookingRealtimeNotifier,

    // NOTA: Ver ADR arriba sobre inyección directa de PrismaService
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly remindersService: RemindersService,
    private readonly workingPatternValidator: WorkingPatternValidator,
  ) { }

  async execute(id: number, newData: UpdateBookingDto) {
    //* 1) Cargar booking y autorizar
    const booking = await this.bookingRepository.findOne({ id });
    if (
      !booking || // Se valida que exista
      booking.commerceId !== newData.commerceId || // Se valida que el comercio sea el mismo donde se realizo la reserva
      booking.customerId !== newData.customerId // Se valida que el usuario que pide, sea el mismo que realizo la reserva
    ) {
      throw new HttpException(
        'No autorizado o reserva no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    // Se valida que sea reagendable
    const commerceConfig =
      await this.commerceConfigRepository.findCommerceConfig({
        commerceId: booking.commerceId,
      });

    if (!booking.canBeRescheduled(commerceConfig.cancellationDeadlineMinutes)) {
      throw new HttpException(
        'Esta reserva no se puede reagendar',
        HttpStatus.BAD_REQUEST,
      );
    }

    //* 2) Definir el nuevo usuario (o dejar el que ya estaba)
    const userIdToCheck = newData.userId ?? booking.userId;

    //* 3) Determinar que servicios se utilizaran
    let nextServices: Service[];

    if (newData.serviceIds !== undefined) {
      // Buscamos solo los nuevos IDs
      const services = await this.serviceRepository.findServicesByUser({
        serviceIds: newData.serviceIds,
        userId: userIdToCheck,
      });

      if (services.length !== newData.serviceIds.length) {
        throw new HttpException(
          'Al menos uno de los servicios no pertenece al empleado especificado',
          HttpStatus.NOT_FOUND,
        );
      }

      nextServices = services;
    } else {
      // Mantenemos los servicios actuales del booking
      const currentServiceIds = booking.bookingServices.map(
        (bs) => bs.serviceId,
      );
      const services = await this.serviceRepository.findServicesByUser({
        serviceIds: currentServiceIds,
        userId: userIdToCheck,
      });

      nextServices = services;
    }

    //* 4) Validar el usuario
    const nextUser = await this.userRepository.findUserByCommerce({
      userId: userIdToCheck,
      commerceId: newData.commerceId,
    });
    if (!nextUser)
      throw new HttpException(
        'El usuario no existe o no pertenece al comercio',
        HttpStatus.NOT_FOUND,
      );

    //* 4) Determinar fecha y hora de inicio y fin
    const nextTimeStart = newData.timeStart
      ? ensureNotPast(newData.timeStart)
      : booking.timeStart;

    const totalDuration = booking.calcServicesDuration(nextServices);
    const totalPrice = booking.calcTotalPrice(nextServices);
    const nextTimeEnd = addMinutesToTime(nextTimeStart, totalDuration);

    await this.workingPatternValidator.ensureAvailability({
      commerceId: booking.commerceId,
      userId: nextUser.id,
      timeStart: nextTimeStart,
      timeEnd: nextTimeEnd,
    });

    //* 5) Construir diff (solo campos que realmente cambian)
    const dataToUpdate: BookingUpdateData = {
      serviceIds: nextServices.map(
        (service) => new BookingService(booking.id, service.id),
      ),
      totalPrice: totalPrice,
      duration: totalDuration,
      userId: nextUser.id,
      timeStart: nextTimeStart,
      timeEnd: nextTimeEnd,
    };

    if (newData.notes !== undefined && newData.notes !== booking.notes) {
      dataToUpdate.notes = newData.notes;
    }

    //* 6) Si no hay cambios reales, devolver sin tocar
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        message: 'Sin cambios',
        statusCode: HttpStatus.OK,
        data: booking,
      };
    }

    //* 7) TRANSACCIÓN ATÓMICA: booking update + history update + activityLog
    // NOTA: Ejecutamos directamente en Prisma para garantizar atomicidad ACID.
    // Todos estos cambios DEBEN ser atómicos: si uno falla, se hace rollback de todo.
    // Side effects opcionales (reminders, eventos) van FUERA de la transacción.
    let result: Booking;

    try {
      result = await this.prisma.$transaction(async (tx) => {
        // 7.1) Borrar servicios antiguos
        await tx.bookingService.deleteMany({
          where: { bookingId: id },
        });

        // 7.2) Actualizar booking
        const updatedBooking = await tx.booking.update({
          where: { id },
          data: {
            timeStart: dataToUpdate.timeStart,
            timeEnd: dataToUpdate.timeEnd,
            duration: dataToUpdate.duration,
            status: BookingStatus.RESCHEDULED,
            userId: dataToUpdate.userId,
            notes: dataToUpdate.notes,
            totalPrice: dataToUpdate.totalPrice,
            bookingServices: {
              create: dataToUpdate.serviceIds.map((bs) => ({
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

        // 7.3) Actualizar historial
        await tx.bookingHistory.updateMany({
          where: { bookingId: id },
          data: {
            timeStart: updatedBooking.timeStart,
            timeEnd: updatedBooking.timeEnd,
            priceAtBooking: updatedBooking.totalPrice,
            durationAtBooking: updatedBooking.duration,
            userId: updatedBooking.userId,
            notes: updatedBooking.notes,
          },
        });

        // 7.4) Crear activity log
        const updatedFields = Object.keys(dataToUpdate).join(', ');
        const activityLog = ActivityLog.updateLog({
          entityType: EntityType.BOOKING,
          entityId: updatedBooking.id,
          userId: updatedBooking.userId,
          commerceId: updatedBooking.commerceId,
          customerId: updatedBooking.customerId,
          detail: `Se actualizaron los campos: ${updatedFields}.`,
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
          updatedBooking.id,
          updatedBooking.customerId,
          updatedBooking.commerceId,
          updatedBooking.duration,
          updatedBooking.userId,
          updatedBooking.status as BookingStatus,
          updatedBooking.timeStart,
          updatedBooking.timeEnd,
          updatedBooking.notes,
          updatedBooking.totalPrice,
          updatedBooking.bookingServices.map((bs: any) => 
            new BookingService(bs.bookingId || updatedBooking.id, bs.serviceId)
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
          this.logger.warn('Booking time range overlap detected during update', {
            bookingId: id,
            userId: dataToUpdate.userId,
            timeStart: dataToUpdate.timeStart,
            timeEnd: dataToUpdate.timeEnd,
          });
          throw new HttpException(
            'El horario está ocupado (conflicto de reserva simultánea)',
            HttpStatus.CONFLICT,
          );
        }
      }

      this.logger.error('Error updating booking in transaction', error);
      throw new HttpException(
        'Error al actualizar la reserva, intenta de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* 8) SIDE EFFECTS OPCIONALES (fuera de transacción con graceful degradation)
    // HYBRID PATTERN: Los side effects no críticos van FUERA de la transacción.
    // Si fallan, solo se loguean pero NO se hace rollback del booking.
    // Esto permite que el booking se actualice exitosamente incluso si el servicio
    // de reminders o eventos está caído, mejorando la disponibilidad del sistema.

    // 8.1) Actualizar reminder (NO crítico)
    try {
      const reminder = Reminder.update({
        bookingId: result.id,
        customerId: result.customerId,
        commerceId: result.commerceId,
        scheduledAt: nextTimeStart,
        sentAt: null,
        channel: ReminderChannel.email,
        status: ReminderStatus.pending,
      });
      await this.remindersService.updateReminder(reminder);
    } catch (error) {
      this.logger.error('Failed to update reminder (non-critical)', {
        bookingId: result.id,
        error: error instanceof Error ? error.message : error,
      });
      // No lanzamos error, booking ya fue actualizado exitosamente
    }

    // 8.2) Emitir evento (NO crítico)
    try {
      if (Object.keys(dataToUpdate).length > 0) {
        this.eventEmitter.emit(
          BOOKING_EVENTS.RESCHEDULED,
          new BookingRescheduledEvent(result, nextTimeStart),
        );
      }
    } catch (error) {
      this.logger.error('Failed to emit booking rescheduled event (non-critical)', {
        bookingId: result.id,
        error: error instanceof Error ? error.message : error,
      });
      // No lanzamos error, booking ya fue actualizado exitosamente
    }

    // 8.3) Emitir actualización en tiempo real (NO crítico)
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
      // No lanzamos error, booking ya fue actualizado exitosamente
    }

    return {
      message: 'Reserva actualizada exitosamente',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
