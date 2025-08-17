import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

import { CommerceWorkingOverride as CommerceWorkingOverrideDomain } from '@/domain/entities/commerceWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { CreateCommerceOverrideDto } from '@/interfaces/controllers/commerceWorkingOverride/dto/create-commerceOverride.dto';

@Injectable()
export class CreateCommerceWorkingOverride {
  constructor(
    @Inject(COMMERCE_WORKING_OVERRIDE_REPOSITORY)
    private readonly commerceWorkingOverrideRepository: ICommerceWorkingOverrideRepository,

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

  async execute(data: CreateCommerceOverrideDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const existingOverride = await this.commerceWorkingOverrideRepository.verifyCommerceWorkingOverride({
      commerceId: data.commerceId,
      date: data.date
    });
    
    if (existingOverride) {
      throw new HttpException(
        'Ya existe un override para este comercio en la fecha especificada.',
        HttpStatus.CONFLICT
      );
    }
    
    const commerceWorkingOverride = CommerceWorkingOverrideDomain.create({
      commerceId: data.commerceId,
      date: data.date,
      overrideType: data.availabilityType,
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
        entityTypeId: ENTITY_TYPES.COMMERCE_WORKING_OVERRIDE,
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
