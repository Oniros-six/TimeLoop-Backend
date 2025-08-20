import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '@/domain/services/auth/auth.service';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(data: LoginUserDto) {
    const user = await this.authService.validateUser(data);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
