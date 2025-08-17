import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import { COMMERCE_WORKING_OVERRIDE_REPOSITORY } from '@/application/constants/providers';

import { CommerceWorkingOverride as CommerceWorkingOverrideDomain } from '@/domain/entities/commerceWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { UpdateCommerceOverrideDto } from '@/interfaces/controllers/commerceWorkingOverride/dto/update-commerceOverride.dto';

@Injectable()
export class UpdateCommerceWorkingOverride {
  constructor(
    @Inject(COMMERCE_WORKING_OVERRIDE_REPOSITORY)
    private readonly commerceWorkingOverrideRepository: ICommerceWorkingOverrideRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async execute(id: number, data: UpdateCommerceOverrideDto) {
    const existingOverride =
      await this.commerceWorkingOverrideRepository.findCommerceWorkingOverrideById(
        {
          id,
        },
      );

    if (!existingOverride) {
      throw new HttpException(
        'El override del comercio no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    const commerceWorkingOverride = CommerceWorkingOverrideDomain.create({
      commerceId: existingOverride.commerceId,
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
        await this.commerceWorkingOverrideRepository.updateCommerceWorkingOverride(
          {
            id,
            newCommerceWorkingOverrideData: commerceWorkingOverride,
          },
        );

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el override del comercio.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityTypeId: ENTITY_TYPES.COMMERCE_WORKING_OVERRIDE,
        entityId: result.id,
        commerceId: result.commerceId,
        detail: `El override del comercio fue actualizado para la fecha ${result.date.toISOString()}.`,
      });

      return {
        message: 'Override del comercio actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar el override del comercio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
