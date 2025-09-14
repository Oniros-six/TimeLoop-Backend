import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';
import { CreateCommerceDto } from '@/interfaces/controllers/commerces/dto/create-commerce.dto';
import { Commerce as CommerceDomain } from '@/domain/entities/commerce.entity';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';

@Injectable()
export class CreateCommerce {
  constructor(
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(data: CreateCommerceDto) {
    // Validacion de name existente
    if (await this.commerceRepository.findCommerceByName({ name: data.name })) {
      throw new HttpException(
        'Ya existe un comercio con este nombre.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validacion de email existente
    if (
      await this.commerceRepository.findCommerceByEmail({ email: data.email })
    ) {
      throw new HttpException(
        'Ya existe un comercio con este email.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validacion de phone existente
    if (
      await this.commerceRepository.findCommerceByPhone({ phone: data.phone })
    ) {
      throw new HttpException(
        'Ya existe un comercio con este número de telefono.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {

      const commerce = CommerceDomain.createCommerce({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        businessCategory: data.businessCategory,
      });

      // Create commerce
      const result = await this.commerceRepository.createCommerce(commerce);

      if (result === null) {
        throw new HttpException(
          'Error al crear el comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.COMMERCE,
        entityId: result.id,
        userId: null,
        commerceId: result.id,
        customerId: null,
        detail: `El comercio "${result.name}" fue creado.`,
      });

      return {
        message: 'Comercio creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar los datos del comercio, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
