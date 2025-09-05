import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { FindByDateAndCommerceDto } from '@/interfaces/controllers/booking/dto/find-by-date-commerce.dto';
import { BOOKING_REPOSITORY } from '@/application/providers';

@Injectable()
export class FindAllByCommerceAndDate {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(data: FindByDateAndCommerceDto) {
    try {
      const result = await this.bookingRepository.findAllByDateAndCommerce({
        commerceId: data.commerceId,
        timeStart: data.date,
      });

      if (!result || result.length == 0) {
        return {
          message: 'No hay reservas para esta fecha en este comercio.',
          statusCode: HttpStatus.OK,
          data: result,
        };
      }
      return {
        message: `Reservas obtenidas con exito para la fecha: ${data.date.toISOString()}`,
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al obtener las reservas, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
