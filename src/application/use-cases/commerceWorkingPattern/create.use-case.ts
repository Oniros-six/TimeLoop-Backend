import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
} from '@/application/constants/providers';

import { CommerceWorkingPattern as CommerceWorkingPatternDomain } from '@/domain/entities/commerceWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/application/constants/activity-log.constants';
import { CreateCommercePatternDto } from '@/interfaces/controllers/commerceWorkingPattern/dto/create-commercePattern.dto';

@Injectable()
export class CreateCommerceWorkingPattern {
  constructor(
    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async execute(data: CreateCommercePatternDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const commerceWorkingPattern = CommerceWorkingPatternDomain.create({
      commerceId: data.commerceId,
      weekday: data.weekday,
      availabilityType: data.availabilityType,
      morningStart: data.morningStart
        ? this.stringToDate(data.morningStart)
        : null,
      morningEnd: data.morningEnd ? this.stringToDate(data.morningEnd) : null,
      afternoonStart: data.afternoonStart
        ? this.stringToDate(data.afternoonStart)
        : null,
      afternoonEnd: data.afternoonEnd
        ? this.stringToDate(data.afternoonEnd)
        : null,
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
