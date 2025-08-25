import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import {
  USER_REPOSITORY,
  USER_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/providers';

@Injectable()
export class FindAllUserWorkingOverride {
  constructor(
    @Inject(USER_WORKING_OVERRIDE_REPOSITORY)
    private readonly userWorkingOverrideRepository: IUserWorkingOverrideRepository,

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

    const userWorkingOverride =
      await this.userWorkingOverrideRepository.findUserWorkingOverride({
        userId: userId,
      });

    return {
      message: 'Override del usuario encontrados',
      statusCode: HttpStatus.OK,
      data: userWorkingOverride,
    };
  }
}
