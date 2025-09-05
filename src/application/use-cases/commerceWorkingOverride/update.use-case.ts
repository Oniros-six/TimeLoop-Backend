import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import { COMMERCE_WORKING_OVERRIDE_REPOSITORY } from '@/application/providers';

import { CommerceWorkingOverride as CommerceWorkingOverrideDomain } from '@/domain/entities/commerceWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { UpdateCommerceOverrideDto } from '@/interfaces/controllers/commerceWorkingOverride/dto/update-commerceOverride.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateCommerceWorkingOverride {
  constructor(
    @Inject(COMMERCE_WORKING_OVERRIDE_REPOSITORY)
    private readonly commerceWorkingOverrideRepository: ICommerceWorkingOverrideRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(id: number, data: UpdateCommerceOverrideDto) {
    const existingOverride = await this.commerceWorkingOverrideRepository.findCommerceWorkingOverrideById({id});

    if (!existingOverride) {
      throw new HttpException(
        'El override del comercio no existe.',
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
    
    const commerceWorkingOverride = CommerceWorkingOverrideDomain.create({
      commerceId: existingOverride.commerceId,
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
        entityType: EntityType.COMMERCE_WORKING_OVERRIDE,
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
