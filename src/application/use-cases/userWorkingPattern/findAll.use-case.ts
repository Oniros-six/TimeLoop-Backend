import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import {
  USER_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class FindAllUserWorkingPattern {
  constructor(
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,

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

    const userWorkingPattern =
      await this.userWorkingPatternRepository.findUserWorkingPattern({
        userId: userId,
      });

    return {
      message: 'Patrones de trabajo del usuario encontrados',
      statusCode: HttpStatus.OK,
      data: userWorkingPattern,
    };
  }
}
