import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';

@Injectable()
export class FindCommerceByName {
  constructor(
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(name: string) {
    const commerce = await this.commerceRepository.findCommerceByName({
      name: name,
    });

    if (!commerce) {
      throw new HttpException('Comercio no encontrado', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Comercio encontrado',
      statusCode: HttpStatus.OK,
      data: commerce,
    };
  }
}
