import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { UpdateServiceDto } from '@/interfaces/controllers/services/dto/update-service.dto';
import { COMMERCE_REPOSITORY, SERVICE_REPOSITORY } from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ServiceUpdateData } from '@/domain/common/ServiceUpdateData';

@Injectable()
export class UpdateService {
    constructor(
        @Inject(SERVICE_REPOSITORY)
        private readonly serviceRepository: IServiceRepository,

        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        private readonly activityLogService: ActivityLogService,
    ) { }

    async execute(id: number, data: UpdateServiceDto) {
        const commerce = await this.commerceRepository.findCommerce({
            commerceId: data.commerceId,
        });

        if (!commerce) {
            throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
        }

        const service = await this.serviceRepository.findService({
            serviceId: id,
            commerceId: data.commerceId,
        });

        if (!service) {
            throw new HttpException('El servicio no existe.', HttpStatus.NOT_FOUND);
        }

        try {
            if (data.name && data.name !== service.name) {
                const allServices = await this.serviceRepository.findAllServices({
                    commerceId: data.commerceId,
                });
                if (allServices) {
                    const serviceExists = allServices.some(
                        (s) => s.id !== id && s.name === data.name,
                    );
                    if (serviceExists) {
                        throw new HttpException(
                            'Ya existe un servicio con este nombre.',
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                }
            }

            const newServiceData: ServiceUpdateData = {};

            if (data.name && data.name != service.name) {
                newServiceData.name = data.name;
            }
            if (data.durationMinutes && data.durationMinutes != service.durationMinutes) {
                newServiceData.durationMinutes = data.durationMinutes;
            }
            if (data.price && data.price != service.price) {
                newServiceData.price = data.price;
            }

            if (Object.keys(newServiceData).length === 0) {
                return {
                    message: 'No se realizaron cambios en la información.',
                    statusCode: HttpStatus.OK,
                    data: service,
                };
            }

            const result = await this.serviceRepository.updateService({
                serviceId: id,
                commerceId: data.commerceId,
                data: newServiceData
            });

            if (result === null) {
                throw new HttpException(
                    'Error al actualizar el servicio, intente de nuevo en unos minutos.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            const updatedFields = Object.keys(newServiceData).join(', ');

            await this.activityLogService.updated({
                entityTypeId: ENTITY_TYPES.SERVICE,
                entityId: result.id,
                userId: null,
                commerceId: result.commerceId,
                customerId: null,
                detail: `Se actualizaron los campos: ${updatedFields}.`,
            });

            return {
                message: 'Servicio actualizado con éxito',
                statusCode: HttpStatus.OK,
                data: result,
            };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            console.error(message);
            throw new HttpException(
                'Algo salió mal al actualizar los datos del servicio, inténtelo de nuevo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
