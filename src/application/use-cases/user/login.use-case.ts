import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto'
import {
  USER_REPOSITORY
} from '@/application/constants/providers';
import { AuthService } from '@/domain/services/auth/auth.service';

@Injectable()
export class LoginUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly authService: AuthService,
  ) { }

  async execute(data: LoginUserDto) {

    const user = await this.userRepository.findUserByEmail({
      email: data.email,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const validPassword = await this.authService.validatePassword(data.password, user.password);

    if (!validPassword) {
      throw new HttpException('Contraseña incorrecta.', HttpStatus.BAD_REQUEST);
    }

    return user
  }
}
