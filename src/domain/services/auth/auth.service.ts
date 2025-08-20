import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUser } from '@/application/use-cases/user/login.use-case';
import { FindUser } from '@/application/use-cases/user/find.use-case';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUser: LoginUser,
    private readonly findUser: FindUser
  ) {}

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }

  async validatePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async validateUser(data: LoginUserDto) {
    return this.loginUser.execute(data);
  }

  async findUserById(userId: number) {
    return this.findUser.execute(userId);
  }
}
