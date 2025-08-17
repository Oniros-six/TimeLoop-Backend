import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class FindAllCommerceWorkingOverride {
  constructor(
    @Inject(COMMERCE_WORKING_OVERRIDE_REPOSITORY)
    private readonly commerceWorkingOverrideRepository: ICommerceWorkingOverrideRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const commerceWorkingOverride =
      await this.commerceWorkingOverrideRepository.findCommerceWorkingOverride({
        commerceId: commerceId,
      });

    return {
      message: 'Override del usuario encontrados',
      statusCode: HttpStatus.OK,
      data: commerceWorkingOverride,
    };
  }
}
