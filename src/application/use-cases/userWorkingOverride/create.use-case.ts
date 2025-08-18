import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import {
  USER_REPOSITORY,
  USER_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/constants/providers';

import { UserWorkingOverride as UserWorkingOverrideDomain } from '@/domain/entities/userWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';
import { CreateUserOverrideDto } from '@/interfaces/controllers/userWorkingOverride/dto/create-userOverride.dto';

@Injectable()
export class CreateUserWorkingOverride {
  constructor(
    @Inject(USER_WORKING_OVERRIDE_REPOSITORY)
    private readonly userWorkingOverrideRepository: IUserWorkingOverrideRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  private stringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async execute(data: CreateUserOverrideDto) {
    const user = await this.userRepository.findUser({
      userId: data.userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const existingOverride =
      await this.userWorkingOverrideRepository.verifyUserWorkingOverride({
        userId: data.userId,
        date: data.date,
      });

    if (existingOverride) {
      throw new HttpException(
        'Ya existe un override para este usuario en la fecha especificada.',
        HttpStatus.CONFLICT,
      );
    }

    const userWorkingOverride = UserWorkingOverrideDomain.create({
      userId: data.userId,
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
        await this.userWorkingOverrideRepository.createUserWorkingOverride(
          userWorkingOverride,
        );

      if (result === null) {
        throw new HttpException(
          'Error al registrar el override del usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityTypeId: ENTITY_TYPES.USER_WORKING_OVERRIDE,
        entityId: result.id,
        userId: data.userId,
        commerceId: user.commerceId,
        customerId: null,
        detail: `El override del usuario ${user.name} fue creado para la fecha ${data.date.toISOString()}.`,
      });

      return {
        message: 'Override del usuario creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar el override del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
