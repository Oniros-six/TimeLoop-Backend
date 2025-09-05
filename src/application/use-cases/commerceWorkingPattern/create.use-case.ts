import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
} from '@/application/providers';

import { CommerceWorkingPattern as CommerceWorkingPatternDomain } from '@/domain/entities/commerceWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { CreateCommercePatternDto } from '@/interfaces/controllers/commerceWorkingPattern/dto/create-commercePattern.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class CreateCommerceWorkingPattern {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(data: CreateCommercePatternDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const patternExist =
      await this.commerceWorkingPatternRepository.verifyCommerceWorkingPattern({
        commerceId: data.commerceId,
        weekday: data.weekday,
      });

    if (patternExist) {
      throw new HttpException(
        'Ya hay una configuración para este día.',
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
      commerceId: data.commerceId,
      weekday: data.weekday,
      availabilityType: data.availabilityType,
      morningStart: data.morningStart ? data.morningStart : null,
      morningEnd: data.morningEnd ? data.morningEnd : null,
      afternoonStart: data.afternoonStart ? data.afternoonStart : null,
      afternoonEnd: data.afternoonEnd ? data.afternoonEnd : null,
    });

    try {
      const result =
        await this.commerceWorkingPatternRepository.createCommerceWorkingPattern(
          commerceWorkingPattern,
        );

      if (result === null) {
        throw new HttpException(
          'Error al registrar el patrón de trabajo del comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.COMMERCE_WORKING_PATTERN,
        entityId: result.id,
        commerceId: data.commerceId,
        customerId: null,
        detail: `El patrón de trabajo del comercio ${commerce.name} fue creado para el día ${data.weekday}.`,
      });

      return {
        message: 'Patrón de trabajo del comercio creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar el patrón de trabajo del comercio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
