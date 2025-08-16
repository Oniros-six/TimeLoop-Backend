import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import {
  COMMERCE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindAllUsers {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const users = await this.userRepository.findAllUsers({
      commerceId: commerceId,
    });

    if (!users || users.length == 0) {
      return {
        message: 'No hay usuarios asociados a este comercio.',
        statusCode: HttpStatus.OK,
        data: users,
      };
    }

    return {
      message: 'Usuarios obtenidos con éxito',
      statusCode: HttpStatus.OK,
      data: users,
    };
  }
}
