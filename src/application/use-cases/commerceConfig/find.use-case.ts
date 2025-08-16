import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindCommerceConfig {
  constructor(
    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const commerceConfig = await this.commerceConfigRepository.findCommerceConfig({
      commerceId: commerceId,
    });

    return {
      message: 'Configuración del comercio encontrada',
      statusCode: HttpStatus.OK,
      data: commerceConfig,
    };
  }
}
