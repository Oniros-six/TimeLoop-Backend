import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import {
  USER_REPOSITORY,
  USER_CONFIG_REPOSITORY,
} from '@/application/constants/providers';
import { IUserConfigRepository } from '@/domain/repositories/userConfig.repository';

@Injectable()
export class FindUserConfig {
  constructor(
    @Inject(USER_CONFIG_REPOSITORY)
    private readonly userConfigRepository: IUserConfigRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number) {
    const user = await this.userRepository.findUser({
      userId: userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const userConfig = await this.userConfigRepository.findUserConfig({
      userId: userId,
    });

    return {
      message: 'Configuración del usuario encontrada',
      statusCode: HttpStatus.OK,
      data: userConfig,
    };
  }
}
