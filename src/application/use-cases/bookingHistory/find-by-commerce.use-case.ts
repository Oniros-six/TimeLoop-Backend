import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BOOKING_HISTORY_REPOSITORY, COMMERCE_REPOSITORY } from '@/application/providers';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindByCommerce {
    constructor(
        @Inject(BOOKING_HISTORY_REPOSITORY)
        private readonly bookingHistoryRepository: IBookingHistoryRepository,
        
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

        const history = await this.bookingHistoryRepository.findByCommerce({
            commerceId: commerceId,
        });
         
        if (!history || history.length == 0) {
            return {
                message: 'No hay historial asociado a este comercio.',
                statusCode: HttpStatus.OK,
                data: history,
            };
        }

        return {
            message: 'Historial obtenido con éxito',
            statusCode: HttpStatus.OK,
            data: history,
        };
    }
}
