import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';

@Injectable()
export class SuspendCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        private readonly activityLogService: ActivityLogService,
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
            await this.activityLogService.suspended({
                entityTypeId: ENTITY_TYPES.COMMERCE,
                entityId: result.id,
                userId: null,
                commerceId: result.id,
                customerId: null,
                detail: `Se suspende la actividad del comercio`,
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
