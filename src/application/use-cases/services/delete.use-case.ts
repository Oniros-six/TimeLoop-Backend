import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import {
  COMMERCE_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class DeleteService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(id: number, commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const service = await this.serviceRepository.findOne({
      serviceId: id,
      commerceId: commerceId,
    });

    if (!service) {
      throw new HttpException('El servicio no existe.', HttpStatus.NOT_FOUND);
    }

    try {
      const result = await this.serviceRepository.deleteService({
        serviceId: id,
        commerceId: commerceId,
      });
      if (result === null) {
        throw new HttpException(
          'Error al eliminar el servicio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.cancelled({
        entityType: EntityType.SERVICE,
        entityId: result.id,
        userId: null,
        commerceId: result.commerceId,
        customerId: null,
        detail: `Se eliminó el servicio '${service.name}'.`,
      });

      return {
        message: 'Servicio eliminado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al eliminar el servicio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
