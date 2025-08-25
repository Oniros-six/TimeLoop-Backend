import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { BOOKING_REPOSITORY, SERVICE_REPOSITORY, USER_REPOSITORY } from '@/application/providers';
import { BookingCreatedEvent } from '@/domain/common/booking.events';
import { ReminderChannel, ReminderStatus } from '@/domain/dbEnums/ReminderConstants';
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
import { addMinutesToTime, ensureNotPast } from '@/domain/value-objects/booking/validations';
import { IUserRepository } from '@/domain/repositories/user.repository';

@Injectable()
export class CreateBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly remindersService: RemindersService,

    private readonly eventEmitter: EventEmitter2,
  ) { }

  async execute(data: CreateBookingDto) {
    //* 1) Validación de fecha y hora
    const scheduledAt = ensureNotPast(data.timeStart);

    //* 2) Validar existencia del servicio y del usuario
    const service = await this.serviceRepository.findService({
      serviceId: data.serviceId,
      commerceId: data.commerceId,
    });

    if (!service) {
      throw new HttpException(
        'El servicio no existe o no pertenece al comercio especificado',
        HttpStatus.NOT_FOUND,
      );
    }

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

    //* 3) Calcular timeEnd según duración del servicio
    const timeEnd = addMinutesToTime(data.timeStart, service.durationMinutes);


    //* 4) Validar solapamiento
    const overlappingBookings = await this.bookingRepository.findOverlapping({
      commerceId: data.commerceId,
      timeStart: data.timeStart,
      timeEnd: timeEnd,
    });

    if (overlappingBookings) {
      throw new HttpException('El horario está ocupado', HttpStatus.CONFLICT);
    }

    //* 5) Crear booking como entidad de dominio
    const booking = Booking.createPending(
      data.customerId,
      data.serviceId,
      data.commerceId,
      data.userId,
      data.timeStart,
      timeEnd,
      service.durationMinutes,
      data.notes,
    );

    const result = await this.bookingRepository.createSchedule(booking);
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

    //* 7) Crear recordatorio
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


    //* 8) Emitir evento de creación
    this.eventEmitter.emit(BOOKING_EVENTS.CREATED, new BookingCreatedEvent(result));

    return {
      message: 'Su reserva ha sido agendada con éxito.',
      statusCode: HttpStatus.OK,
      data: result,
    };
  } catch(err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error(message);
    throw new HttpException(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
