import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import {
  COMMERCE_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class FindUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(id: number, commerceId: number) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findUser({
      userId: id,
      commerceId: commerceId,
    });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Usuario encontrado',
      statusCode: HttpStatus.OK,
      data: user,
    };
  }
}
