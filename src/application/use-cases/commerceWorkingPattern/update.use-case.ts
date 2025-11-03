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

  async execute(commerceId: number, data: UpdateCommercePatternDto[]) {
    try {
      const updates = [] as CommerceWorkingPatternDomain[];

      for (const item of data) {
        const existingPattern =
          await this.commerceWorkingPatternRepository.findCommerceWorkingPatternById(
            {
              id: item.id,
            },
          );

        if (!existingPattern) {
          throw new HttpException(
            `El patrón de trabajo del comercio con id ${item.id} no existe.`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (existingPattern.commerceId !== commerceId) {
          throw new HttpException(
            `El patrón de trabajo con id ${item.id} no pertenece al comercio ${commerceId}.`,
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

        const commerceWorkingPattern = CommerceWorkingPatternDomain.create({
          commerceId: existingPattern.commerceId,
          weekday: existingPattern.weekday,
          availabilityType: item.availabilityType,
          morningStart: item.morningStart,
          morningEnd: item.morningEnd,
          afternoonStart: item.afternoonStart,
          afternoonEnd: item.afternoonEnd,
        });

        const result =
          await this.commerceWorkingPatternRepository.updateCommerceWorkingPattern(
            {
              id: item.id,
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
          commerceId: commerceId,
          customerId: null,
          detail: `El patrón de trabajo del comercio fue actualizado para el día ${result.weekday}.`,
        });

        updates.push(result);
      }

      return {
        message: 'Patrones de trabajo del comercio actualizados con éxito',
        statusCode: HttpStatus.OK,
        data: updates,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar los patrones de trabajo del comercio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
