import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BOOKING_HISTORY_REPOSITORY } from '@/application/providers';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { FindByDateDto } from '@/interfaces/controllers/bookingHistory/dto/find-by-date.dto';

@Injectable()
export class FindByDates {
  constructor(
    @Inject(BOOKING_HISTORY_REPOSITORY)
    private readonly bookingHistoryRepository: IBookingHistoryRepository,
  ) {}

  async execute(data: FindByDateDto) {
    const history = await this.bookingHistoryRepository.findByDates({
      startDate: data.startDate,
      endDate: data.endDate,
    });

    if (!history || history.length == 0) {
      return {
        message: 'No hay historial.',
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
