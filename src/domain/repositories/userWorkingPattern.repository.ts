import { WeekDays } from '../common/weekdays';
import { UserWorkingPattern } from '../entities/userWorkingPattern.entity';

export interface IUserWorkingPatternRepository {
  findUserWorkingPattern(data: {
    userId: number;
  }): Promise<UserWorkingPattern[] | null>;

  findUserWorkingPatternById(data: {
    id: number;
  }): Promise<UserWorkingPattern | null>;

  createUserWorkingPattern(
    data: UserWorkingPattern,
  ): Promise<UserWorkingPattern | null>;

  verifyUserWorkingPattern(data: {
    userId: number;
    weekday: WeekDays;
  }): Promise<boolean>;

  updateUserWorkingPattern(data: {
    id: number;
    newUserWorkingPatternData: UserWorkingPattern;
  }): Promise<UserWorkingPattern | null>;
}
