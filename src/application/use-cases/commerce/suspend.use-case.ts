import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import {
    COMMERCE_REPOSITORY,
    ACTIVITY_LOG_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class SuspendCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        @Inject(ACTIVITY_LOG_REPOSITORY)
        private readonly activityLogRepository: IActivityLogRepository,
    ) { }

    async execute(id: number) {
        try {
            const commerce = await this.commerceRepository.findCommerce({ commerceId: id });

            if (!commerce || commerce.id !== id) {
                throw new HttpException(
                    'No autorizado o comercio no encontrado',
                    HttpStatus.NOT_FOUND,
                );
            }

            const result = await this.commerceRepository.suspendCommerce({ commerceId: id });

            if (result === null) {
                throw new HttpException(
                    'Error al suspender el estado del comercio, intenta de nuevo en unos minutos.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            // Activity register
            await this.activityLogRepository.create({
                entityTypeId: 4, // Commerce
                entityId: result.id,
                changeTypeId: 3, // Suspended
                detail: 'Commerce suspended',
                userId: null,
                commerceId: result.id,
                customerId: null,
            });

            return {
                message: 'Actividad del comercio suspendida con exito',
                statusCode: HttpStatus.OK,
                data: result,
            };

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            console.error(message);
            throw new HttpException(
                'Algo salió mal al suspender el comercio, inténtelo de nuevo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
