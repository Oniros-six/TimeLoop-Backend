import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { BOOKING_REPOSITORY } from '@/application/providers';
import { FindByUserDto } from '@/interfaces/controllers/booking/dto/find-by-user.dto';

@Injectable()
export class FindAllByUser {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(data: FindByUserDto) {
    try {
      const result = await this.bookingRepository.findAllByUser({
        userId: data.userId,
      });

      if (!result || result.length == 0) {
        return {
          message: 'No hay reservas para este usuario.',
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
