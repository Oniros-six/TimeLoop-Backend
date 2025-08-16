import { UserUpdateData } from '../common/UserUpdateData';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  findUser(data: { userId: number }): Promise<User | null>;

  findUserByName(data: {
    commerceId: number;
    name: string;
  }): Promise<User | null>;

  findUserByEmail(data: {
    commerceId: number;
    email: string;
  }): Promise<User | null>;

  findAllUsers(data: { commerceId: number }): Promise<User[] | null>;

  suspendUser(data: {
    commerceId: number;
    userId: number;
  }): Promise<User | null>;

  reinstateUser(data: {
    commerceId: number;
    userId: number;
  }): Promise<User | null>;

  createUser(data: User): Promise<User | null>;

  updateUser(data: {
    userId: number;
    commerceId: number;
    newUserData: UserUpdateData;
  }): Promise<User | null>;
}
