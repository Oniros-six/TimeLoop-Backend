import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import {
  USER_REPOSITORY,
  USER_WORKING_OVERRIDE_REPOSITORY,
} from '@/application/providers';

import { UserWorkingOverride as UserWorkingOverrideDomain } from '@/domain/entities/userWorkingOverride.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { CreateUserOverrideDto } from '@/interfaces/controllers/userWorkingOverride/dto/create-userOverride.dto';
import { validateAvailabilityTimes } from '@/domain/value-objects/configs/validate-hours';

@Injectable()
export class CreateUserWorkingOverride {
  constructor(
    @Inject(USER_WORKING_OVERRIDE_REPOSITORY)
    private readonly userWorkingOverrideRepository: IUserWorkingOverrideRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

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

    validateAvailabilityTimes({
      availabilityType: data.availabilityType,
      morningStart: data.morningStart,
      morningEnd: data.morningEnd,
      afternoonStart: data.afternoonStart,
      afternoonEnd: data.afternoonEnd
    })

    const userWorkingOverride = UserWorkingOverrideDomain.create({
      userId: data.userId,
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
        entityType: EntityType.USER_WORKING_OVERRIDE,
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
