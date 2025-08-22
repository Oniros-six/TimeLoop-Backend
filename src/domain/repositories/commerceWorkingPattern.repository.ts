import { WeekDays } from '../common/weekdays';
import { CommerceWorkingPattern } from '../entities/commerceWorkingPattern.entity';

export interface ICommerceWorkingPatternRepository {
  findCommerceWorkingPattern(data: {
    commerceId: number;
  }): Promise<CommerceWorkingPattern[] | null>;

  findCommerceWorkingPatternById(data: {
    id: number;
  }): Promise<CommerceWorkingPattern | null>;

  createCommerceWorkingPattern(
    data: CommerceWorkingPattern,
  ): Promise<CommerceWorkingPattern | null>;

  verifyCommerceWorkingPattern(data: {
    commerceId: number;
    weekday: WeekDays;
  }): Promise<boolean>;

  updateCommerceWorkingPattern(data: {
    id: number;
    newCommerceWorkingPatternData: CommerceWorkingPattern;
  }): Promise<CommerceWorkingPattern | null>;
}
