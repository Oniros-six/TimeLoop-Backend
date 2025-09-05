import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  BOOKING_HISTORY_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { FindByDateUserDto } from '@/interfaces/controllers/bookingHistory/dto/find-by-date-user.dto';

@Injectable()
export class FindByUserDate {
  constructor(
    @Inject(BOOKING_HISTORY_REPOSITORY)
    private readonly bookingHistoryRepository: IBookingHistoryRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(data: FindByDateUserDto) {
    const user = await this.userRepository.findUser({
      userId: data.userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const history = await this.bookingHistoryRepository.findByDatesAndUser({
      userId: data.userId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    if (!history || history.length == 0) {
      return {
        message: 'No hay historial asociado a este usuario para estas fechas.',
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
