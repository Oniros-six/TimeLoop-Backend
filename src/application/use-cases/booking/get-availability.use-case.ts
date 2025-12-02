import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/providers';
import { AvailabilityDto } from '@/interfaces/controllers/booking/dto/availability.dto';
import { resolveWeekdayFromUtcDate } from '@/domain/utils/working-pattern.utils';
import { Booking } from '@/domain/entities/booking.entity';
import {
  generateAvailableSlots,
  validateNoDuplicateServices,
  validateUserBelongsToCommerce,
  validateServicesBelongToUser,
  hasAvailablePatterns,
  createNoAvailabilityResponse,
} from '@/domain/utils/booking/availability.utils';
import { CommerceWorkingPattern } from '@/domain/entities/commerceWorkingPattern.entity';
import { UserWorkingPattern } from '@/domain/entities/userWorkingPattern.entity';

@Injectable()
export class GetAvailability {
  private readonly logger = new Logger(GetAvailability.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,
  ) {}

  async execute(data: AvailabilityDto) {
    try {
      //* 1) Validar servicios duplicados
      validateNoDuplicateServices(data.services);

      //* 2) Validar que el usuario pertenezca al comercio
      const user = await this.userRepository.findUserByCommerce({
        userId: data.userId,
        commerceId: data.commerceId,
      });
      validateUserBelongsToCommerce(user);

      //* 3) Validar que los servicios pertenezcan al usuario
      const services = await this.serviceRepository.findServicesByUser({
        serviceIds: data.services,
        userId: data.userId,
      });
      validateServicesBelongToUser(services, data.services);

      //* 4) Calcular duración total de los servicios
      const totalDuration = Booking.calcServicesDuration(services);

      if (totalDuration <= 0) {
        throw new HttpException(
          'La duración total de los servicios debe ser mayor a cero',
          HttpStatus.BAD_REQUEST,
        );
      }

      //* 5) Calcular weekday antes de las consultas paralelas
      const weekday = resolveWeekdayFromUtcDate(data.date);

      //* 6) Ejecutar consultas independientes en paralelo para mejorar eficiencia
      const [commercePatterns, userPatterns, existingBookings] =
        await Promise.all([
          this.commerceWorkingPatternRepository.findCommerceWorkingPattern({
            commerceId: data.commerceId,
          }),
          this.userWorkingPatternRepository.findUserWorkingPattern({
            userId: data.userId,
          }),
          this.bookingRepository.findAllByDateAndUser({
            userId: data.userId,
            timeStart: data.date,
          }),
        ]);

      const commercePattern = commercePatterns?.find(
        (pattern) => pattern.weekday === weekday,
      );

      const userPattern = userPatterns?.find(
        (pattern) => pattern.weekday === weekday,
      );

      //* 7) Verificar disponibilidad de patrones
      if (!hasAvailablePatterns(commercePattern, userPattern)) {
        return createNoAvailabilityResponse();
      }

      //* 8) Generar slots disponibles
      const availableSlots = generateAvailableSlots({
        date: data.date,
        commercePattern: commercePattern!,
        userPattern: userPattern!,
        totalDuration,
        existingBookings: existingBookings || [],
      });

      return {
        message: 'Disponibilidad obtenida con éxito',
        statusCode: HttpStatus.OK,
        data: availableSlots,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }

      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.logger.error(`Error al obtener disponibilidad: ${message}`, err);
      throw new HttpException(
        'Algo salió mal al obtener la disponibilidad, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

