import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginUser } from '@/application/use-cases/user/login.use-case';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly loginUser: LoginUser) {
    super({ usernameField: 'email' });
  }

  async validate(data: LoginUserDto) {
    const user = await this.loginUser.execute(data);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
