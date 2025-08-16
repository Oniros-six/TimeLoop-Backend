import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class FindAllCommerceWorkingPattern {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,

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

    const commerceWorkingPattern =
      await this.commerceWorkingPatternRepository.findCommerceWorkingPattern({
        commerceId: commerceId,
      });

    return {
      message: 'Patrones de trabajo del comercio encontrados',
      statusCode: HttpStatus.OK,
      data: commerceWorkingPattern,
    };
  }
}
