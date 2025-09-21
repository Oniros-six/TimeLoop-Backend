import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import {
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { IUserRepository } from '@/domain/repositories/user.repository';

@Injectable()
export class FindService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, userId: number) {
    const user = await this.userRepository.findUser({
      userId: userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const service = await this.serviceRepository.findOne({
      serviceId: id,
    });

    if (!service) {
      throw new HttpException('Servicio no encontrado o no pertenece a este empleado', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Servicio encontrado',
      statusCode: HttpStatus.OK,
      data: service,
    };
  }
}
