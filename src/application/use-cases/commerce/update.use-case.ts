import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import {
    COMMERCE_REPOSITORY,
    ACTIVITY_LOG_REPOSITORY,
} from '@/application/constants/providers';
import { UpdateCommerceDto } from '@/interfaces/controllers/commerces/dto/update-commerce.dto';
import { CommerceUpdateData } from '@/domain/common/CommerceUpdateData';

@Injectable()
export class UpdateCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        @Inject(ACTIVITY_LOG_REPOSITORY)
        private readonly activityLogRepository: IActivityLogRepository,
    ) { }

    async execute(id: number, data: UpdateCommerceDto) {

        // Validacion de existencia
        const found = await this.commerceRepository.findCommerce({ commerceId: id });

        if (!found) {
            throw new HttpException('Comercio no encontrado', HttpStatus.NOT_FOUND);
        }
        
        try {
            const newCommerceData: CommerceUpdateData = {};

            if (data.name && data.name != found.name) {
                newCommerceData.name = data.name;
            }
            if (data.email && data.email != found.email) {
                newCommerceData.email = data.email;
            }
            if (data.phone && data.phone != found.phone) {
                newCommerceData.phone = data.phone;
            }
            if (data.address && data.address != found.address) {
                newCommerceData.address = data.address;
            }
            if (data.businessCategory && data.businessCategory != found.businessCategory) {
                newCommerceData.businessCategory = data.businessCategory;
            }
   

            if (Object.keys(newCommerceData).length === 0) {
                return {
                    message: 'Información actualizada con exito',
                    statusCode: HttpStatus.OK,
                    data: found,
                };
            }

            const result = await this.commerceRepository.updateCommerce({
                id: found.id,
                newCommerceData: newCommerceData,
            });

            if (result === null) {
                throw new HttpException(
                    'Error al actualizar el comercio, intente de nuevo en unos minutos.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            await this.activityLogRepository.create({
                entityTypeId: 4, // Commerce
                entityId: result.id,
                userId: null,
                commerceId: result.id,
                customerId: null,
                changeTypeId: 2, // Updated
                detail: 'Commerce updated',
            });

            return {
                message: 'Comercio actualizado con éxito',
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
