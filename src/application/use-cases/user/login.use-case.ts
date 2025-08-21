import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto';
import { AuthService } from '@/domain/services/auth/auth.service';

@Injectable()
export class LoginUser {
  constructor(
    private readonly authService: AuthService,
  ) { }

  async execute(data: LoginUserDto) {
    const user = await this.authService.validateUser(data);

    if (!user) {
      throw new HttpException('Credenciales inválidas.', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
