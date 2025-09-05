import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { COMMERCE_WORKING_PATTERN_REPOSITORY } from '@/application/providers';

import { CommerceWorkingPattern as CommerceWorkingPatternDomain } from '@/domain/entities/commerceWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { UpdateCommercePatternDto } from '@/interfaces/controllers/commerceWorkingPattern/dto/update-commercePattern.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateCommerceWorkingPattern {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(id: number, data: UpdateCommercePatternDto) {
    const existingPattern =
      await this.commerceWorkingPatternRepository.findCommerceWorkingPatternById(
        {
          id,
        },
      );

    if (!existingPattern) {
      throw new HttpException(
        'El patrón de trabajo del comercio no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    validateAvailabilityTimes({
      availabilityType: data.availabilityType,
      morningStart: data.morningStart,
      morningEnd: data.morningEnd,
      afternoonStart: data.afternoonStart,
      afternoonEnd: data.afternoonEnd,
    });

    const commerceWorkingPattern = CommerceWorkingPatternDomain.create({
      commerceId: existingPattern.commerceId,
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
        await this.commerceWorkingPatternRepository.updateCommerceWorkingPattern(
          {
            id,
            newCommerceWorkingPatternData: commerceWorkingPattern,
          },
        );

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el patrón de trabajo del comercio.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityType: EntityType.COMMERCE_WORKING_PATTERN,
        entityId: result.id,
        commerceId: result.commerceId,
        customerId: null,
        detail: `El patrón de trabajo del comercio fue actualizado para el día ${result.weekday}.`,
      });

      return {
        message: 'Patrón de trabajo del comercio actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar el patrón de trabajo del comercio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
