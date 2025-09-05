import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { StateUserDto } from '@/interfaces/controllers/user/dto/state-user.dto';

@Injectable()
export class SuspendUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(data: StateUserDto) {
    const user = await this.userRepository.findUser({
      userId: data.userId,
    });

    if (!user) {
      throw new HttpException(
        'Usuario no encontrado en el comercio especificado.',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const result = await this.userRepository.suspendUser({
        userId: data.userId,
      });

      if (result === null) {
        throw new HttpException(
          'Error al suspender el usuario, intenta de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Activity register
      await this.activityLogService.suspended({
        entityType: EntityType.USER,
        entityId: result.id,
        userId: result.id,
        commerceId: result.commerceId,
        customerId: null,
        detail: `Se suspende la actividad del usuario ${result.name}`,
      });

      return {
        message: 'Actividad del usuario suspendida con exito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al suspender el usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
