import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { CreateServiceDto } from '@/interfaces/controllers/services/dto/create-service.dto';
import { Service as ServiceDomain } from '@/domain/entities/service.entity';
import {
  COMMERCE_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class CreateService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(data: CreateServiceDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const services = await this.serviceRepository.findAllServices({
      commerceId: data.commerceId,
    });

    if (services && services.length > 0) {
      const serviceExists = services.some(
        (service) => service.name === data.name,
      );
      if (serviceExists) {
        throw new HttpException(
          'Ya existe un servicio con este nombre.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const service = ServiceDomain.create({
        commerceId: data.commerceId,
        name: data.name,
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
        userId: null,
        commerceId: result.commerceId,
        customerId: null,
        detail: `El servicio ${result.name} fue creado.`,
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
