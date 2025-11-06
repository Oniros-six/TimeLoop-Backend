import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { UpdateServiceDto } from '@/interfaces/controllers/services/dto/update-service.dto';
import {
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ServiceUpdateData } from '@/domain/common/ServiceUpdateData';

@Injectable()
export class UpdateService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(id: number, data: UpdateServiceDto) {
    // Validar que el usuario existe y pertenece al comercio
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

    const service = await this.serviceRepository.findOne({
      serviceId: id,
    });

    if (!service) {
      throw new HttpException('El servicio no existe.', HttpStatus.NOT_FOUND);
    }

    try {
      const newServiceData: ServiceUpdateData = service.diffFrom({
        name: data.name,
        description: data.description,
        price: data.price,
        durationMinutes: data.durationMinutes,
      });

      if (newServiceData.name) {
        const allServices = await this.serviceRepository.findAllServices({
          userId: data.userId,
        });
        if (allServices) {
          const serviceExists = allServices.some(
            (s) => s.id !== id && s.name === newServiceData.name,
          );
          if (serviceExists) {
            throw new HttpException(
              'Ya existe un servicio con este nombre para este empleado.',
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      if (Object.keys(newServiceData).length === 0) {
        return {
          message: 'No se realizaron cambios en la información.',
          statusCode: HttpStatus.OK,
          data: service,
        };
      }

      const result = await this.serviceRepository.updateService({
        serviceId: id,
        data: newServiceData,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el servicio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const updatedFields = Object.keys(newServiceData).join(', ');

      await this.activityLogService.updated({
        entityType: EntityType.SERVICE,
        entityId: result.id,
        userId: result.userId,
        commerceId: data.commerceId,
        customerId: null,
        detail: `Se actualizaron los campos: ${updatedFields} del servicio del empleado ${user.name}.`,
      });

      return {
        message: 'Servicio actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar los datos del servicio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
