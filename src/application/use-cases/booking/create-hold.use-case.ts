import {
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { Booking } from '@/domain/entities/booking.entity';
import { BookingService } from '@/domain/entities/bookingService.entity';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ensureNotPast } from '@/domain/value-objects/booking/validations';
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { Prisma } from '@prisma/client';

/**
 * DTO para crear un hold temporal
 */
export class CreateHoldDto {
  customerId: number;
  commerceId: number;
  userId: number;
  serviceIds: number[];
  timeStart: Date;
  notes?: string;
}

/**
 * Use Case: Crear un "hold" temporal de 15 minutos
 * 
 * PROPÓSITO:
 * Cuando un cliente selecciona un horario y va a pagar, necesitamos "reservar"
 * ese horario temporalmente para evitar que otro usuario lo tome mientras
 * completa el pago.
 * 
 * FLUJO:
 * 1. Cliente selecciona horario → Se crea HOLD (15 min)
 * 2. Cliente completa pago → HOLD se convierte a CONFIRMED
 * 3. Cliente abandona → Cron limpia el HOLD después de 15 min
 * 
 * INTEGRACIÓN CON WEBSOCKETS:
 * Cuando se crea/libera un hold, se emite evento para actualizar disponibilidad
 * en tiempo real para otros usuarios viendo el mismo día.
 */
@Injectable()
export class CreateHold {
  private readonly logger = new Logger(CreateHold.name);
  private readonly HOLD_EXPIRATION_MINUTES = 15;

  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly prisma: PrismaService,
  ) {}

  async execute(data: CreateHoldDto) {
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

    //* 5) Calcular expiración (15 minutos desde ahora)
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
            status: BookingStatus.HOLD, // ← Status HOLD
            notes: booking.notes,
            expiresAt: expiresAt, // ← Expira en 15 min
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
      // Handle exclusion constraint violation (horario ocupado)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034' || error.message?.includes('unique_user_booking_range')) {
          this.logger.warn('Horario no disponible (ocupado o en hold)', {
            userId: data.userId,
            timeStart: data.timeStart,
            timeEnd: booking.timeEnd,
          });
          throw new HttpException(
            'El horario ya no está disponible',
            HttpStatus.CONFLICT,
          );
        }
      }

      this.logger.error('Error creating hold', error);
      throw new HttpException(
        'Error al reservar el horario temporalmente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.log(`Hold created: ${result.id}, expires at ${expiresAt.toISOString()}`);

    return {
      message: 'Horario prereservado. Complete el pago en 15 minutos.',
      statusCode: HttpStatus.CREATED,
      data: {
        holdId: result.id,
        expiresAt: expiresAt,
        expiresInSeconds: this.HOLD_EXPIRATION_MINUTES * 60,
      },
    };
  }
}

