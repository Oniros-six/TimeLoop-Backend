import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import { USER_WORKING_PATTERN_REPOSITORY } from '@/application/constants/providers';

import { UserWorkingPattern as UserWorkingPatternDomain } from '@/domain/entities/userWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/application/constants/activity-log.constants';
import { UpdateUserPatternDto } from '@/interfaces/controllers/userWorkingPattern/dto/update-userPattern.dto';

@Injectable()
export class UpdateUserWorkingPattern {
  constructor(
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async execute(id: number, data: UpdateUserPatternDto) {
    const existingPattern =
      await this.userWorkingPatternRepository.findUserWorkingPatternById({
        id,
      });

    if (!existingPattern) {
      throw new HttpException(
        'El patrón de trabajo no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    const userWorkingPattern = UserWorkingPatternDomain.create({
      userId: existingPattern.userId,
      weekday: existingPattern.weekday,
      availabilityType:
        data.availabilityType ?? existingPattern.availabilityType,
      morningStart: data.morningStart
        ? this.stringToDate(data.morningStart)
        : existingPattern.morningStart,
      morningEnd: data.morningEnd
        ? this.stringToDate(data.morningEnd)
        : existingPattern.morningEnd,
      afternoonStart: data.afternoonStart
        ? this.stringToDate(data.afternoonStart)
        : existingPattern.afternoonStart,
      afternoonEnd: data.afternoonEnd
        ? this.stringToDate(data.afternoonEnd)
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
