import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

import { CommerceWorkingOverride as CommerceWorkingOverrideDomain } from '@/domain/entities/commerceWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { CreateCommerceOverrideDto } from '@/interfaces/controllers/commerceWorkingOverride/dto/create-commerceOverride.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class CreateCommerceWorkingOverride {
  constructor(
    @Inject(COMMERCE_WORKING_OVERRIDE_REPOSITORY)
    private readonly commerceWorkingOverrideRepository: ICommerceWorkingOverrideRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(data: CreateCommerceOverrideDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const existingOverride =
      await this.commerceWorkingOverrideRepository.verifyCommerceWorkingOverride(
        {
          commerceId: data.commerceId,
          date: data.date,
        },
      );

    if (existingOverride) {
      throw new HttpException(
        'Ya existe un override para este comercio en la fecha especificada.',
        HttpStatus.CONFLICT,
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
      commerceId: data.commerceId,
      date: data.date,
      overrideType: data.availabilityType,
      morningStart: data.morningStart
        ? data.morningStart
        : null,
      morningEnd: data.morningEnd ? data.morningEnd : null,
      afternoonStart: data.afternoonStart
        ? data.afternoonStart
        : null,
      afternoonEnd: data.afternoonEnd
        ? data.afternoonEnd
        : null,
      notes: data.notes || '',
    });

    try {
      const result =
        await this.commerceWorkingOverrideRepository.createCommerceWorkingOverride(
          commerceWorkingOverride,
        );

      if (result === null) {
        throw new HttpException(
          'Error al registrar el override del comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.COMMERCE_WORKING_OVERRIDE,
        entityId: result.id,
        commerceId: data.commerceId,
        customerId: null,
        detail: `El override del comercio ${commerce.name} fue creado para la fecha ${data.date.toISOString()}.`,
      });

      return {
        message: 'Override del comercio creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar el override del comercio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
