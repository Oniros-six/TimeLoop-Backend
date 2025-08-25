import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/application/providers';
import { Inject } from '@nestjs/common';
import { LoginUserDto } from '@/interfaces/controllers/auth/dto/login-user.dto';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async validateUser(data: LoginUserDto) {
    const user = await this.userRepository.findUserByEmail({
      email: data.email,
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await this.passwordHasher.compare(
      data.password,
      user.password,
    );

    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    return this.passwordHasher.hash(password);
  }

  async findUserById(userId: number) {
    return this.userRepository.findUser({ userId });
  }
}
