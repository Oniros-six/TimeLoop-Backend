import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/application/constants/providers';

@Injectable()
export class FindUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number) {
    const user = await this.userRepository.findUser({
      userId: id,
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
