import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginUser } from '@/application/use-cases/user/login.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly loginUser: LoginUser) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.loginUser.execute({email, password});
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
