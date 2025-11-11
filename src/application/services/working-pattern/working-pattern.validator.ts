import {
  COMMERCE_WORKING_PATTERN_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/providers';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import {
  isScheduleWithinWorkingPattern,
  resolveWeekdayFromUtcDate,
} from '@/domain/utils/working-pattern.utils';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

type EnsureAvailabilityParams = {
  commerceId: number;
  userId: number;
  timeStart: Date;
  timeEnd: Date;
};

@Injectable()
export class WorkingPatternValidator {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,

    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,
  ) {}

  async ensureAvailability({
    commerceId,
    userId,
    timeStart,
    timeEnd,
  }: EnsureAvailabilityParams): Promise<void> {
    const weekday = resolveWeekdayFromUtcDate(timeStart);

    const commercePatterns =
      await this.commerceWorkingPatternRepository.findCommerceWorkingPattern({
        commerceId,
      });

    const commercePattern = commercePatterns?.find(
      (pattern) => pattern.weekday === weekday,
    );

    if (
      !commercePattern ||
      !isScheduleWithinWorkingPattern(commercePattern, timeStart, timeEnd)
    ) {
      throw new HttpException(
        'El comercio no está disponible en el horario seleccionado.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userPatterns =
      await this.userWorkingPatternRepository.findUserWorkingPattern({
        userId,
      });

    const userPattern = userPatterns?.find(
      (pattern) => pattern.weekday === weekday,
    );

    if (
      !userPattern ||
      !isScheduleWithinWorkingPattern(userPattern, timeStart, timeEnd)
    ) {
      throw new HttpException(
        'El colaborador no está disponible en el horario seleccionado.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

