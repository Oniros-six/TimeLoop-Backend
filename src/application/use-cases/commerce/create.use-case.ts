import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import {
    COMMERCE_REPOSITORY,
    ACTIVITY_LOG_REPOSITORY,
} from '@/application/constants/providers';
import { CreateCommerceDto } from '@/interfaces/controllers/commerces/dto/create-commerce.dto';
import { Commerce as CommerceDomain } from '@/domain/entities/commerce.entity';

@Injectable()
export class CreateCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        @Inject(ACTIVITY_LOG_REPOSITORY)
        private readonly activityLogRepository: IActivityLogRepository,
    ) { }

    async execute(data: CreateCommerceDto) {

        // Validacion de existencia
        const found = await this.commerceRepository.findCommerceByName({
            name: data.name
        });

        // Si existe se devuelve, en lugar de crearlo
        if (found) {
            const commerce = CommerceDomain.createCommerce({
                id: found.id,
                name: found.name,
                email: found.email,
                phone: found.phone,
                address: found.address,
                businessCategory: found.businessCategory,
            });
            return commerce;
        }

        try {
            const commerce = CommerceDomain.createCommerce({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                businessCategory: data.businessCategory,
            });

            // Create commerce
            const result = await this.commerceRepository.createCommerce(commerce);

            if (result === null) {
                throw new HttpException(
                    'Error al crear el comercio, intente de nuevo en unos minutos.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            await this.activityLogRepository.create({
                entityTypeId: 4, // Commerce
                entityId: result.id,
                userId: null,
                commerceId: result.id,
                customerId: null,
                changeTypeId: 1, // Created
                detail: 'Commerce created',
            });

            return {
                message: 'Comercio creado con éxito',
                statusCode: HttpStatus.OK,
                data: result,
            };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            console.error(message);
            throw new HttpException(
                'Algo salió mal al guardar los datos del comercio, inténtelo de nuevo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
