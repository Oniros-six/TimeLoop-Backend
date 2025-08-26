import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BOOKING_HISTORY_REPOSITORY, COMMERCE_REPOSITORY } from '@/application/providers';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { FindByDateCommerceDto } from '@/interfaces/controllers/bookingHistory/dto/find-by-date-commerce.dto';

@Injectable()
export class FindByCommerceDate {
    constructor(
        @Inject(BOOKING_HISTORY_REPOSITORY)
        private readonly bookingHistoryRepository: IBookingHistoryRepository,
        
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,
    ) { }

    async execute(data: FindByDateCommerceDto) {
        const commerce = await this.commerceRepository.findCommerce({
            commerceId: data.commerceId
        });

        if (!commerce) {
            throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
        }

        const history = await this.bookingHistoryRepository.findByDatesAndCommerce({
            commerceId: data.commerceId,
            startDate: data.startDate,
            endDate: data.endDate
        });

        if (!history || history.length == 0) {
            return {
                message: 'No hay historial asociado a este comercio para estas fechas.',
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
