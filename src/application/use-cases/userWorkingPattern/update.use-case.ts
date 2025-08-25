import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import { USER_WORKING_PATTERN_REPOSITORY } from '@/application/providers';

import { UserWorkingPattern as UserWorkingPatternDomain } from '@/domain/entities/userWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { UpdateUserPatternDto } from '@/interfaces/controllers/userWorkingPattern/dto/update-userPattern.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateUserWorkingPattern {
  constructor(
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(id: number, data: UpdateUserPatternDto) {
    const existingPattern = await this.userWorkingPatternRepository.findUserWorkingPatternById({ id });

    if (!existingPattern) {
      throw new HttpException(
        'El patrón de trabajo no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    validateAvailabilityTimes({
      availabilityType: data.availabilityType,
      morningStart: data.morningStart,
      morningEnd: data.morningEnd,
      afternoonStart: data.afternoonStart,
      afternoonEnd: data.afternoonEnd
    })

    const userWorkingPattern = UserWorkingPatternDomain.create({
      userId: existingPattern.userId,
      weekday: existingPattern.weekday,
      availabilityType:
        data.availabilityType ?? existingPattern.availabilityType,
      morningStart: data.morningStart
        ? data.morningStart
        : existingPattern.morningStart,
      morningEnd: data.morningEnd
        ? data.morningEnd
        : existingPattern.morningEnd,
      afternoonStart: data.afternoonStart
        ? data.afternoonStart
        : existingPattern.afternoonStart,
      afternoonEnd: data.afternoonEnd
        ? data.afternoonEnd
        : existingPattern.afternoonEnd,
    });

    try {
      const result =
        await this.userWorkingPatternRepository.updateUserWorkingPattern({
          id,
          newUserWorkingPatternData: userWorkingPattern,
        });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el patrón de trabajo del usuario.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityType: EntityType.USER_WORKING_PATTERN,
        entityId: result.id,
        userId: result.userId,
        commerceId: null,
        customerId: null,
        detail: `El patrón de trabajo del usuario fue actualizado para el día ${result.weekday}.`,
      });

      return {
        message: 'Patrón de trabajo del usuario actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar el patrón de trabajo.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
