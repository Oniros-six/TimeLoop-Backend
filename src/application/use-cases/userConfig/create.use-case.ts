import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import {
  USER_REPOSITORY,
  USER_CONFIG_REPOSITORY,
} from '@/application/constants/providers';
import { IUserConfigRepository } from '@/domain/repositories/userConfig.repository';
import { CreateUserConfigDto } from '@/interfaces/controllers/userConfig/dto/create-userConfig.dto';
import { UserConfig as UserConfigDomain } from '@/domain/entities/userConfig.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/application/constants/activity-log.constants';

@Injectable()
export class CreateUserConfig {
  constructor(
    @Inject(USER_CONFIG_REPOSITORY)
    private readonly userConfigRepository: IUserConfigRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(userId: number, data: CreateUserConfigDto) {
    const user = await this.userRepository.findUser({
      userId: userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const configExistence = await this.userConfigRepository.findUserConfig({
      userId: userId,
    });

    if (configExistence) {
      throw new HttpException('El usuario ya tiene una configuración.', HttpStatus.BAD_REQUEST);
    }

    const userConfig = UserConfigDomain.create({
      userId: userId,
    });

    try {
      const result =
        await this.userConfigRepository.createUserConfig(userConfig);

      if (result === null) {
        throw new HttpException(
          'Error al registrar la configuración del usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.USER_CONFIG,
        entityId: result.id,
        userId: userId,
        commerceId: user.commerceId,
        customerId: null,
        detail: `La configuración del usuario ${user.name} fue creada.`,
      });

      return {
        message: 'Configuración del usuario creada con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar la configuración del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
