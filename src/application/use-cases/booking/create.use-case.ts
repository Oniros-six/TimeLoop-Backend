import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import {
  BOOKING_HISTORY_REPOSITORY,
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
import { Reminder } from '@/domain/entities/reminder.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { BOOKING_EVENTS } from '@/domain/services/notifications/notifications.service';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { CreateBookingDto } from '@/interfaces/controllers/booking/dto/create-booking.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ensureNotPast } from '@/domain/value-objects/booking/validations';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { BookingHistory } from '@/domain/entities/bookingHistory.entity';

@Injectable()
export class CreateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BOOKING_HISTORY_REPOSITORY)
    private readonly bookingHistoryRepository: IBookingHistoryRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly remindersService: RemindersService,

    private readonly eventEmitter: EventEmitter2,
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

    //* 5) Validar solapamiento
    const overlappingBookings = await this.bookingRepository.findOverlapping({
      userId: data.userId,
      timeStart: data.timeStart,
      timeEnd: booking.timeEnd,
    });

    if (overlappingBookings) {
      throw new HttpException('El horario está ocupado', HttpStatus.CONFLICT);
    }

    const result = await this.bookingRepository.createSchedule(
      booking,
      data.idempotencyKey,
    );
    if (!result) {
      throw new HttpException(
        'Error al registrar la reserva, intente de nuevo en unos minutos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //* 6) Registrar actividad
    await this.activityLogService.created({
      entityType: EntityType.BOOKING,
      entityId: result.id,
      userId: result.userId,
      commerceId: result.commerceId,
      customerId: result.customerId,
      detail: `Se crea una nueva reserva`,
    });

    //* 7) Generar historial
    const history = BookingHistory.create({
      bookingId: result.id,
      commerceId: result.commerceId,
      customerId: result.customerId,
      userId: result.userId,
      priceAtBooking: result.totalPrice,
      durationAtBooking: result.duration,
      timeStart: result.timeStart,
      timeEnd: result.timeEnd,
      status: result.status,
      notes: result.notes,
    });

    await this.bookingHistoryRepository.create(history);

    //* 8) Crear recordatorio
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

    //* 9) Emitir evento de creación
    this.eventEmitter.emit(
      BOOKING_EVENTS.CREATED,
      new BookingCreatedEvent(result),
    );

    return {
      message: 'Su reserva ha sido agendada con éxito.',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
