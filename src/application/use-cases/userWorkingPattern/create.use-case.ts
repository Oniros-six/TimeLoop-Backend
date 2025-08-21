import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import {
  USER_REPOSITORY,
  USER_WORKING_PATTERN_REPOSITORY,
} from '@/application/constants/providers';

import { UserWorkingPattern as UserWorkingPatternDomain } from '@/domain/entities/userWorkingPattern.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/application/constants/activity-log.constants';
import { CreateUserPatternDto } from '@/interfaces/controllers/userWorkingPattern/dto/create-userPattern.dto';

@Injectable()
export class CreateUserWorkingPattern {
  constructor(
    @Inject(USER_WORKING_PATTERN_REPOSITORY)
    private readonly userWorkingPatternRepository: IUserWorkingPatternRepository,

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

  async execute(data: CreateUserPatternDto) {
    const user = await this.userRepository.findUser({
      userId: data.userId,
    });

    if (!user) {
      throw new HttpException('El usuario no existe.', HttpStatus.NOT_FOUND);
    }

    const userWorkingPattern = UserWorkingPatternDomain.create({
      userId: data.userId,
      weekday: data.weekday,
      availabilityType: data.availabilityType,
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
    });

    try {
      const result =
        await this.userWorkingPatternRepository.createUserWorkingPattern(
          userWorkingPattern,
        );

      if (result === null) {
        throw new HttpException(
          'Error al registrar el patrón de trabajo del usuario, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.USER_WORKING_PATTERN,
        entityId: result.id,
        userId: data.userId,
        commerceId: user.commerceId,
        customerId: null,
        detail: `El patrón de trabajo del usuario ${user.name} fue creado para el día ${data.weekday}.`,
      });

      return {
        message: 'Patrón de trabajo del usuario creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar el patrón de trabajo del usuario, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
