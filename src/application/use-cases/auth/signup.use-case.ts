import {
  COMMERCE_CONFIG_REPOSITORY,
  COMMERCE_REPOSITORY,
  COMMERCE_WORKING_PATTERN_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CreateBusinessDto } from '@/interfaces/controllers/auth/dto/signup.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Commerce } from '@/domain/entities/commerce.entity';
import { User } from '@/domain/entities/user.entity';
import { CommerceConfig } from '@/domain/entities/commerceConfig.entity';
import { CommerceWorkingPattern } from '@/domain/entities/commerceWorkingPattern.entity';
import { Roles } from '@/domain/dbEnums/UserRoles.enum';
import { PaymentMethod } from '@/domain/dbEnums/PaymentMethods.enum';
import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { WeekDays } from '@/domain/dbEnums/Weekdays.enum';

@Injectable()
export class Signup {
  constructor(
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(COMMERCE_CONFIG_REPOSITORY)
    private readonly commerceConfigRepository: ICommerceConfigRepository,

    @Inject(COMMERCE_WORKING_PATTERN_REPOSITORY)
    private readonly commerceWorkingPatternRepository: ICommerceWorkingPatternRepository,
  ) {}

  async execute(data: CreateBusinessDto) {
    // Tracking de IDs creados para rollback
    const createdIds = {
      commerceId: null as number | null,
      userId: null as number | null,
      commerceConfigId: null as number | null,
      workingPatternIds: [] as number[],
    };

    try {
      //* 1. Crear el comercio
      const newCommerce = Commerce.createCommerce({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        businessCategory: data.businessCategory,
      });

      const commerceResult =
        await this.commerceRepository.createCommerce(newCommerce);
      createdIds.commerceId = commerceResult!.id;

      //* 2. Crear el usuario ADMIN (dueño)
      const ownerUser = User.create({
        name: data.ownerName,
        email: data.email,
        password: data.password,
        role: Roles.ADMIN,
        commerceId: commerceResult!.id,
      });

      const userResult = await this.userRepository.createUser(ownerUser);
      createdIds.userId = userResult!.id;

      //* 3. Crear configuración del comercio con valores por defecto
      const commerceConfig = CommerceConfig.create({
        commerceId: commerceResult!.id,
        cancellationDeadlineMinutes: 60, // Una hora por default
        welcomeMessage: 'Bienvenidos!',
        acceptedPaymentMethods: [PaymentMethod.CASH],
      });

      const commerceConfigResult =
        await this.commerceConfigRepository.createCommerceConfig(
          commerceConfig,
        );
      createdIds.commerceConfigId = commerceConfigResult!.id;

      //* 4. Crear el Working Pattern del comercio con valores por defecto
      for (const weekday of Object.values(WeekDays)) {
        const schedule = data.schedules.find((s) => s.weekday === weekday);

        if (!schedule) {
          // Si no hay config en data para ese día, lo marcamos como "off"
          const commerceWP = CommerceWorkingPattern.create({
            commerceId: commerceResult!.id,
            weekday,
            availabilityType: AvailabilityType.off,
            morningStart: null,
            morningEnd: null,
            afternoonStart: null,
            afternoonEnd: null,
          });

          const wpResult =
            await this.commerceWorkingPatternRepository.createCommerceWorkingPattern(
              commerceWP,
            );
          createdIds.workingPatternIds.push(wpResult!.id);
          continue;
        }

        for (const shift of schedule.shifts) {
          const hasMorning = !!(shift.morningOpen && shift.morningClose);
          const hasAfternoon = !!(shift.afternoonOpen && shift.afternoonClose);

          let availabilityType: AvailabilityType;

          if (hasMorning && hasAfternoon) {
            availabilityType = AvailabilityType.full;
          } else if (hasMorning || hasAfternoon) {
            availabilityType = AvailabilityType.half;
          } else {
            availabilityType = AvailabilityType.off;
          }

          const commerceWP = CommerceWorkingPattern.create({
            commerceId: commerceResult!.id,
            weekday: weekday,
            availabilityType,
            morningStart: shift.morningOpen,
            morningEnd: shift.morningClose,
            afternoonStart: shift.afternoonOpen,
            afternoonEnd: shift.afternoonClose,
          });

          const wpResult =
            await this.commerceWorkingPatternRepository.createCommerceWorkingPattern(
              commerceWP,
            );
          createdIds.workingPatternIds.push(wpResult!.id);
        }
      }

      return {
        message: 'Registro completado exitosamente',
        statusCode: HttpStatus.CREATED,
        data: {
          commerce: {
            id: commerceResult!.id,
            name: commerceResult!.name,
            email: commerceResult!.email,
            phone: commerceResult!.phone,
            address: commerceResult!.address,
            businessCategory: commerceResult!.businessCategory,
            active: commerceResult!.active,
          },
          owner: {
            id: userResult!.id,
            name: userResult!.name,
            email: userResult!.email,
            role: userResult!.role,
            commerceId: userResult!.commerceId,
            active: userResult!.active,
          },
          configs: {
            commerceConfig: {
              id: commerceConfigResult!.id,
              cancellationDeadlineMinutes:
                commerceConfigResult!.cancellationDeadlineMinutes,
              welcomeMessage: commerceConfigResult!.welcomeMessage,
              acceptedPaymentMethods:
                commerceConfigResult!.acceptedPaymentMethods,
            },
          },
        },
      };
    } catch (err: unknown) {
      // 🔄 ROLLBACK: Eliminar todos los datos creados en caso de error
      await this.rollback(createdIds);

      // Log del error original para debugging
      console.error('Error en signup:', err);

      // Re-lanzar errores de dominio (HttpException)
      if (err instanceof HttpException) {
        throw err;
      }

      // Convertir errores inesperados a HttpException
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new HttpException(
        `Error durante el registro del negocio: ${message}. Inténtelo de nuevo.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Método privado para realizar rollback de operaciones en caso de error
   * Elimina los datos creados en orden inverso para respetar foreign keys
   */
  private async rollback(createdIds: {
    commerceId: number | null;
    userId: number | null;
    commerceConfigId: number | null;
    workingPatternIds: number[];
  }): Promise<void> {
    console.log('🔄 Iniciando rollback de operaciones...', createdIds);

    try {
      // 4. Eliminar Working Patterns (si existen)
      for (const wpId of createdIds.workingPatternIds) {
        try {
          const success =
            await this.commerceWorkingPatternRepository.deleteCommerceWorkingPattern(
              { id: wpId },
            );
          if (success) {
            console.log(`✅ Working Pattern ${wpId} eliminado`);
          } else {
            console.log(`⚠️ No se pudo eliminar Working Pattern ${wpId}`);
          }
        } catch (error) {
          console.error(`Error eliminando Working Pattern ${wpId}:`, error);
        }
      }

      // 3. Eliminar Commerce Config (si existe)
      if (createdIds.commerceConfigId && createdIds.commerceId) {
        try {
          const success =
            await this.commerceConfigRepository.deleteCommerceConfig({
              commerceId: createdIds.commerceId,
            });
          if (success) {
            console.log(
              `✅ Commerce Config eliminado para comercio ${createdIds.commerceId}`,
            );
          } else {
            console.log(
              `⚠️ No se pudo eliminar Commerce Config para comercio ${createdIds.commerceId}`,
            );
          }
        } catch (error) {
          console.error(`Error eliminando Commerce Config:`, error);
        }
      }

      // 2. Eliminar User (si existe)
      if (createdIds.userId) {
        try {
          const success = await this.userRepository.deleteUser({
            userId: createdIds.userId,
          });
          if (success) {
            console.log(`✅ Usuario ${createdIds.userId} eliminado`);
          } else {
            console.log(`⚠️ No se pudo eliminar Usuario ${createdIds.userId}`);
          }
        } catch (error) {
          console.error(
            `Error eliminando Usuario ${createdIds.userId}:`,
            error,
          );
        }
      }

      // 1. Eliminar Commerce (si existe)
      if (createdIds.commerceId) {
        try {
          const success = await this.commerceRepository.deleteCommerce({
            commerceId: createdIds.commerceId,
          });
          if (success) {
            console.log(`✅ Comercio ${createdIds.commerceId} eliminado`);
          } else {
            console.log(
              `⚠️ No se pudo eliminar Comercio ${createdIds.commerceId}`,
            );
          }
        } catch (error) {
          console.error(
            `Error eliminando Comercio ${createdIds.commerceId}:`,
            error,
          );
        }
      }

      console.log('✅ Rollback completado');
    } catch (rollbackError) {
      console.error('❌ Error crítico durante rollback:', rollbackError);
      // No lanzamos el error para no enmascarar el error original
    }
  }
}
