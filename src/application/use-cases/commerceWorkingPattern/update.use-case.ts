import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { COMMERCE_WORKING_PATTERN_REPOSITORY } from '@/application/constants/providers';

import { CommerceWorkingPattern as CommerceWorkingPatternDomain } from '@/domain/entities/commerceWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { UpdateCommercePatternDto } from '@/interfaces/controllers/commerceWorkingPattern/dto/update-commercePattern.dto';

@Injectable()
export class UpdateCommerceWorkingPattern {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

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

    const commerceWorkingPattern = CommerceWorkingPatternDomain.create({
      commerceId: existingPattern.commerceId,
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
        entityTypeId: ENTITY_TYPES.COMMERCE_WORKING_PATTERN,
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
