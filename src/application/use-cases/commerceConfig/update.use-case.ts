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
import { UpdateCommerceConfigDto } from '@/interfaces/controllers/commerceConfig/dto/update-commerceConfig.dto';
import { validateOpenCloseTime } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class UpdateCommerceConfig {
  constructor(
    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(commerceId: number, data: UpdateCommerceConfigDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const commerceConfig =
      await this.commerceConfigRepository.findCommerceConfig({
        commerceId,
      });

    if (!commerceConfig) {
      throw new HttpException(
        'La configuración del comercio no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (data.openTime) {
      validateOpenCloseTime(data.openTime, commerceConfig.closeTime)
    }

    if (data.closeTime) {
      validateOpenCloseTime(commerceConfig.openTime, data.closeTime)
    }

    const updatedConfigData = CommerceConfigDomain.create({
      commerceId: commerceId,
      standardDurationMinutes:
        data.standardDurationMinutes ?? commerceConfig.standardDurationMinutes,
      allowNotifications:
        data.allowNotifications ?? commerceConfig.allowNotifications,
      openTime: data.openTime ?? commerceConfig.openTime,
      closeTime: data.closeTime ?? commerceConfig.closeTime,
      welcomeMessage: data.welcomeMessage ?? commerceConfig.welcomeMessage,
    });

    try {
      const result = await this.commerceConfigRepository.updateCommerceConfig({
        commerceId,
        newCommerceConfigData: updatedConfigData,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar la configuración del comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityType: EntityType.COMMERCE_CONFIG,
        entityId: result.id,
        userId: null,
        commerceId: commerceId,
        customerId: null,
        detail: `La configuración del comercio ${commerce.name} fue actualizada.`,
      });

      return {
        message: 'Configuración del comercio actualizada con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar la configuración del comercio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
