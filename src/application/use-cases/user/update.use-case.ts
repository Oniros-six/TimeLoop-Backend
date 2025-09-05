import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { UpdateUserDto } from '@/interfaces/controllers/user/dto/update-user.dto';
import { Roles } from '@/domain/dbEnums/UserRoles.enum';
import { AuthService } from '@/domain/services/auth/auth.service';

@Injectable()
export class UpdateUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly authService: AuthService,
  ) {}

  async execute(id: number, data: UpdateUserDto) {
    const user = await this.userRepository.findUser({
      userId: id,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    if (data.email && data.email !== user.email) {
      const emailExists = await this.userRepository.findUserByEmail({
        email: data.email,
      });
      if (emailExists) {
        throw new HttpException(
          'Ya existe un usuario con este correo.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (data.role && !Object.values(Roles).includes(data.role)) {
      throw new HttpException('Rol inexistente.', HttpStatus.BAD_REQUEST);
    }

    if (data.password) {
      data.password = await this.authService.hashPassword(data.password);
    }

    const hasChanges = user.update(data);

    if (!hasChanges) {
      return {
        message: 'No se realizaron cambios en la información.',
        statusCode: HttpStatus.OK,
        data: user,
      };
    }

    try {
      const result = await this.userRepository.updateUser({
        userId: id,
        newUserData: user,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.updated({
        entityType: EntityType.USER,
        entityId: result.id,
        userId: result.id,
        commerceId: user.commerceId,
        customerId: null,
        detail: `Se actualizaron los campos del user: ${user.id}.`,
      });

      return {
        message: 'Usuario actualizado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al actualizar los datos del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
