import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import {
    COMMERCE_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class FindCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,
    ) { }

    async execute(id: number) {
        const commerce = await this.commerceRepository.findCommerce({ commerceId: id });

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
