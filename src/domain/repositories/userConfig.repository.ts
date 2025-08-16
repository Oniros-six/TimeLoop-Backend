import { UserConfig } from '../entities/userConfig.entity';

export interface IUserConfigRepository {
  findUserConfig(data: { userId: number }): Promise<UserConfig | null>;

  createUserConfig(data: UserConfig): Promise<UserConfig | null>;

  updateUserConfig(data: {
    userId: number;
    newUserData: UserConfig;
  }): Promise<UserConfig | null>;
}
