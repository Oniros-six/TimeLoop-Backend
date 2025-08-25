import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import { USER_WORKING_OVERRIDE_REPOSITORY } from '@/application/providers';

import { UserWorkingOverride as UserWorkingOverrideDomain } from '@/domain/entities/userWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { UpdateUserOverrideDto } from '@/interfaces/controllers/userWorkingOverride/dto/update-userOverride.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateUserWorkingOverride {
  constructor(
    @Inject(USER_WORKING_OVERRIDE_REPOSITORY)
    private readonly userWorkingOverrideRepository: IUserWorkingOverrideRepository,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(id: number, data: UpdateUserOverrideDto) {
    const existingOverride =
      await this.userWorkingOverrideRepository.findUserWorkingOverrideById({
        id,
      });

    if (!existingOverride) {
      throw new HttpException(
        'El override del usuario no existe.',
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

    const userWorkingOverride = UserWorkingOverrideDomain.create({
      userId: existingOverride.userId,
      date: data.date ?? existingOverride.date,
      overrideType: data.availabilityType ?? existingOverride.overrideType,
      morningStart: data.morningStart
        ? data.morningStart
        : existingOverride.morningStart,
      morningEnd: data.morningEnd
        ? data.morningEnd
        : existingOverride.morningEnd,
      afternoonStart: data.afternoonStart
        ? data.afternoonStart
        : existingOverride.afternoonStart,
      afternoonEnd: data.afternoonEnd
        ? data.afternoonEnd
        : existingOverride.afternoonEnd,
      notes: data.notes ?? existingOverride.notes,
    });

    try {
      const result =
        await this.userWorkingOverrideRepository.updateUserWorkingOverride({
          id,
          newUserWorkingOverrideData: userWorkingOverride,
        });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el override del usuario.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityType: EntityType.USER_WORKING_OVERRIDE,
        entityId: result.id,
        userId: result.userId,
        commerceId: null,
        customerId: null,
        detail: `El override del usuario fue actualizado para la fecha ${result.date.toISOString()}.`,
      });

      return {
        message: 'Override del usuario actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar el override del usuario.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
