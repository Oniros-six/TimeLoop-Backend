import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import { USER_WORKING_OVERRIDE_REPOSITORY } from '@/application/constants/providers';

import { UserWorkingOverride as UserWorkingOverrideDomain } from '@/domain/entities/userWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { UpdateUserOverrideDto } from '@/interfaces/controllers/userWorkingOverride/dto/update-userOverride.dto';

@Injectable()
export class UpdateUserWorkingOverride {
  constructor(
    @Inject(USER_WORKING_OVERRIDE_REPOSITORY)
    private readonly userWorkingOverrideRepository: IUserWorkingOverrideRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

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

    const userWorkingOverride = UserWorkingOverrideDomain.create({
      userId: existingOverride.userId,
      date: existingOverride.date,
      overrideType: data.availabilityType ?? existingOverride.overrideType,
      morningStart: data.morningStart
        ? this.stringToDate(data.morningStart)
        : existingOverride.morningStart,
      morningEnd: data.morningEnd
        ? this.stringToDate(data.morningEnd)
        : existingOverride.morningEnd,
      afternoonStart: data.afternoonStart
        ? this.stringToDate(data.afternoonStart)
        : existingOverride.afternoonStart,
      afternoonEnd: data.afternoonEnd
        ? this.stringToDate(data.afternoonEnd)
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
        entityTypeId: ENTITY_TYPES.USER_WORKING_OVERRIDE,
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
