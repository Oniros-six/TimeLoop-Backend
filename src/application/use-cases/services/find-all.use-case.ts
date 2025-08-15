import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { COMMERCE_REPOSITORY, SERVICE_REPOSITORY } from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindAllServices {
    constructor(
        @Inject(SERVICE_REPOSITORY)
        private readonly serviceRepository: IServiceRepository,

        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,
    ) { }

    async execute(commerceId: number) {
        const commerce = await this.commerceRepository.findCommerce({
            commerceId: commerceId,
        });

        if (!commerce) {
            throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
        }

        const services = await this.serviceRepository.findAllServices({
            commerceId: commerceId,
        });

        if (!services || services.length == 0) {
            return {
                message: 'No hay servicios asociados a este comercio.',
                statusCode: HttpStatus.OK,
                data: services,
            };
        }

        return {
            message: 'Servicios obtenidos con éxito',
            statusCode: HttpStatus.OK,
            data: services,
        };
    }
}
