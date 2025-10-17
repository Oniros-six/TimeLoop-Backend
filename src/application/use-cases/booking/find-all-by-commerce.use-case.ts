import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { FindByCommerceDto } from '@/interfaces/controllers/booking/dto/find-by-commerce.dto';
import { BOOKING_REPOSITORY } from '@/application/providers';

@Injectable()
export class FindAllByCommerce {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(data: FindByCommerceDto) {
    try {
      const result = await this.bookingRepository.findAllByCommerce({
        commerceId: data.commerceId,
        limit: data.limit,
        cursor: data.cursor
      });

      if (!result || result.items.length == 0) {
        return {
          message: 'No hay reservas en este comercio.',
          statusCode: HttpStatus.OK,
          data: result,
        };
      }

      return {
        message: 'Reservas obtenidas con exito',
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
