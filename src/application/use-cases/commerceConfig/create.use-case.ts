import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  COMMERCE_REPOSITORY,
  COMMERCE_CONFIG_REPOSITORY,
} from '@/application/constants/providers';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { CommerceConfig as CommerceConfigDomain } from '@/domain/entities/commerceConfig.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/application/constants/activity-log.constants';
import { CreateCommerceConfigDto } from '@/interfaces/controllers/commerceConfig/dto/create-commerceConfig.dto';
import { validateOpenCloseTime } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class CreateCommerceConfig {
  constructor(
    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(commerceId: number, data: CreateCommerceConfigDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const configExistence = await this.commerceConfigRepository.findCommerceConfig({
      commerceId: commerceId,
    });

    if (configExistence) {
      throw new HttpException('El comercio ya tiene una configuración.', HttpStatus.BAD_REQUEST);
    }

    validateOpenCloseTime(data.openTime, data.closeTime)

    const commerceConfig = CommerceConfigDomain.create({
      commerceId: commerceId,
      standardDurationMinutes: data.standardDurationMinutes,
      allowNotifications: data.allowNotifications,
      openTime: data.openTime,
      closeTime: data.closeTime,
      welcomeMessage: data.welcomeMessage,
    });

    try {
      const result =
        await this.commerceConfigRepository.createCommerceConfig(
          commerceConfig,
        );

      if (result === null) {
        throw new HttpException(
          'Error al registrar la configuración del comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.COMMERCE_CONFIG,
        entityId: result.id,
        userId: null,
        commerceId: commerceId,
        customerId: null,
        detail: `La configuración del comercio ${commerce.name} fue creada.`,
      });

      return {
        message: 'Configuración del comercio creada con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar la configuración del comercio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
