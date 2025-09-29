import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { CreateServiceDto } from '@/interfaces/controllers/services/dto/create-service.dto';
import { Service as ServiceDomain } from '@/domain/entities/service.entity';
import {
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { IUserRepository } from '@/domain/repositories/user.repository';

@Injectable()
export class CreateService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(data: CreateServiceDto) {
    // Validar que el usuario existe
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

    // Validar que no existe un servicio con el mismo nombre para este usuario
    const services = await this.serviceRepository.findAllServices({
      userId: data.userId,
    });

    if (services && services.length > 0) {
      const serviceExists = services.some(
        (service) => service.name === data.name,
      );
      if (serviceExists) {
        throw new HttpException(
          'Ya existe un servicio con este nombre para este usuario.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const service = ServiceDomain.create({
        userId: data.userId,
        name: data.name,
        description: data.description,
        price: data.price,
        durationMinutes: data.durationMinutes,
      });

      const result = await this.serviceRepository.createService(service);

      if (result === null) {
        throw new HttpException(
          'Error al registrar el servicio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.SERVICE,
        entityId: result.id,
        userId: result.userId,
        commerceId: data.commerceId,
        customerId: null,
        detail: `El servicio ${result.name} fue creado para el usuario ${user.name}.`,
      });

      return {
        message: 'Servicio creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar los datos del servicio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
