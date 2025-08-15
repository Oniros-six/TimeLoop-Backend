import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import {
  COMMERCE_REPOSITORY,
  SERVICE_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(id: number, commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const service = await this.serviceRepository.findService({
      serviceId: id,
      commerceId: commerceId,
    });

    if (!service) {
      throw new HttpException('Servicio no encontrado', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Servicio encontrado',
      statusCode: HttpStatus.OK,
      data: service,
    };
  }
}
