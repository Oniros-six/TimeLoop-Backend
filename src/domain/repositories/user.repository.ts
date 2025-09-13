import { User } from '../entities/user.entity';

export interface IUserRepository {
  findUser(data: { userId: number }): Promise<User | null>;

  findUserByCommerce(data: {
    userId: number;
    commerceId: number;
  }): Promise<User | null>;

  findUserByName(data: {
    commerceId: number;
    name: string;
  }): Promise<User | null>;

  findUserByEmail(data: { email: string }): Promise<User | null>;

  findAllUsers(data: { commerceId: number }): Promise<User[] | null>;

  suspendUser(data: { userId: number }): Promise<User | null>;

  reinstateUser(data: { userId: number }): Promise<User | null>;

  createUser(data: User): Promise<User | null>;

  updateUser(data: { userId: number; newUserData: User }): Promise<User | null>;

  deleteUser(data: { userId: number }): Promise<boolean>;
}
