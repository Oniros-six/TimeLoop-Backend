import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import {
  USER_REPOSITORY,
  USER_CONFIG_REPOSITORY,
} from '@/application/constants/providers';
import { IUserConfigRepository } from '@/domain/repositories/userConfig.repository';
import { UpdateUserConfigDto } from '@/interfaces/controllers/userConfig/dto/update-userConfig.dto';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { UserConfig as UserConfigDomain } from '@/domain/entities/userConfig.entity';

@Injectable()
export class UpdateUserConfig {
  constructor(
    @Inject(USER_CONFIG_REPOSITORY)
    private readonly userConfigRepository: IUserConfigRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(userId: number, data: UpdateUserConfigDto) {
    const user = await this.userRepository.findUser({
      userId: userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const userConfig = await this.userConfigRepository.findUserConfig({
      userId,
    });

    if (!userConfig) {
      throw new HttpException(
        'La configuración de usuario no existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedConfigData = UserConfigDomain.create({
      userId: userId,
      darkMode: data.darkMode ?? userConfig.darkMode,
      reminder: data.reminder ?? userConfig.reminder,
      reminderFrequency: data.reminderFrequency ?? userConfig.reminderFrequency,
    });

    try {
      const result = await this.userConfigRepository.updateUserConfig({
        userId,
        newUserConfigData: updatedConfigData,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar la configuración del usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityTypeId: ENTITY_TYPES.USER_CONFIG,
        entityId: result.id,
        userId: userId,
        commerceId: user.commerceId,
        customerId: null,
        detail: `La configuración del usuario ${user.name} fue actualizada.`,
      });

      return {
        message: 'Configuración del usuario actualizada con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar la configuración del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
