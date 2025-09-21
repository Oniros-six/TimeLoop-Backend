import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import {
  SERVICE_REPOSITORY,
} from '@/application/providers';

@Injectable()
export class DeleteService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(serviceId: number) {

    const service = await this.serviceRepository.findOne({
      serviceId: serviceId,
    });

    if (!service) {
      throw new HttpException('Servicio no encontrado', HttpStatus.NOT_FOUND);
    }

    try {
      const result = await this.serviceRepository.deleteService({
        serviceId: serviceId,
      });

      if (!result) {
        throw new HttpException(
          'Error al eliminar el servicio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

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