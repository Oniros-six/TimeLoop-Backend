import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CreateUserDto } from '@/interfaces/controllers/user/dto/create-user.dto';
import { User as UserDomain } from '@/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  COMMERCE_REPOSITORY,
} from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { Roles } from '@/domain/dbEnums/user-roles.constants';
import { AuthService } from '@/domain/services/auth/auth.service';

@Injectable()
export class CreateUser {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,

    private readonly authService: AuthService,
  ) {}

  async execute(data: CreateUserDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const userExists = await this.userRepository.findUserByEmail({
      email: data.email,
    });

    if (userExists) {
      throw new HttpException(
        'Ya existe un usuario con este email.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!Object.values(Roles).includes(data.role)) {
      throw new HttpException('Rol inexistente.', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.authService.hashPassword(data.password);

    const user = UserDomain.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      commerceId: data.commerceId,
    });

    try {
      const result = await this.userRepository.createUser(user);

      if (result === null) {
        throw new HttpException(
          'Error al registrar el usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.USER,
        entityId: result.id,
        userId: result.id,
        commerceId: result.commerceId,
        customerId: null,
        detail: `El usuario ${result.name} fue creado.`,
      });

      return {
        message: 'Usuario creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar los datos del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
