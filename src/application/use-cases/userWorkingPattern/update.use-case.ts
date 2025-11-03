import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import { USER_WORKING_PATTERN_REPOSITORY } from '@/application/providers';

import { UserWorkingPattern as UserWorkingPatternDomain } from '@/domain/entities/userWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { UpdateUserPatternDto } from '@/interfaces/controllers/userWorkingPattern/dto/update-userPattern.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateUserWorkingPattern {
  constructor(
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(userId: number, data: UpdateUserPatternDto[]) {
    // En lote: validar y actualizar cada patrón de trabajo
    try {
      const updates = [] as UserWorkingPatternDomain[];

      for (const item of data) {
        const existingPattern =
          await this.userWorkingPatternRepository.findUserWorkingPatternById({
            id: item.id,
          });

        if (!existingPattern) {
          throw new HttpException(
            `El patrón de trabajo con id ${item.id} no existe.`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (existingPattern.userId !== userId) {
          throw new HttpException(
            `El patrón de trabajo con id ${item.id} no pertenece al usuario ${userId}.`,
            HttpStatus.NOT_FOUND,
          );
        }

        validateAvailabilityTimes({
          availabilityType: item.availabilityType,
          morningStart: item.morningStart,
          morningEnd: item.morningEnd,
          afternoonStart: item.afternoonStart,
          afternoonEnd: item.afternoonEnd,
        });

        const userWorkingPattern = UserWorkingPatternDomain.create({
          userId: existingPattern.userId,
          weekday: existingPattern.weekday,
          availabilityType: item.availabilityType,
          morningStart: item.morningStart,
          morningEnd: item.morningEnd,
          afternoonStart: item.afternoonStart,
          afternoonEnd: item.afternoonEnd,
        });

        const result =
          await this.userWorkingPatternRepository.updateUserWorkingPattern({
            id: item.id,
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
          userId: userId,
          commerceId: null,
          customerId: null,
          detail: `El patrón de trabajo del usuario fue actualizado para el día ${result.weekday}.`,
        });

        updates.push(result);
      }

      return {
        message: 'Patrones de trabajo del usuario actualizados con éxito',
        statusCode: HttpStatus.OK,
        data: updates,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar los patrones de trabajo.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
