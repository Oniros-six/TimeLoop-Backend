import { UserWorkingOverride } from '../entities/userWorkingOverride.entity';

export interface IUserWorkingOverrideRepository {
  findUserWorkingOverride(data: {
    userId: number;
  }): Promise<UserWorkingOverride[] | null>;

  findUserWorkingOverrideById(data: {
    id: number;
  }): Promise<UserWorkingOverride | null>;

  createUserWorkingOverride(
    data: UserWorkingOverride,
  ): Promise<UserWorkingOverride | null>;

  verifyUserWorkingOverride(data: {
    userId: number;
    date: Date;
  }): Promise<boolean>;

  updateUserWorkingOverride(data: {
    id: number;
    newUserWorkingOverrideData: UserWorkingOverride;
  }): Promise<UserWorkingOverride | null>;
}
