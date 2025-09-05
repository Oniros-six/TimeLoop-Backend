import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';
import { UpdateCommerceDto } from '@/interfaces/controllers/commerces/dto/update-commerce.dto';
import { CommerceUpdateData } from '@/domain/common/CommerceUpdateData';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';

@Injectable()
export class UpdateCommerce {
  constructor(
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(id: number, data: UpdateCommerceDto) {

    // Validacion de existencia
    const found = await this.commerceRepository.findCommerce({
      commerceId: id,
    });

    if (!found) {
      throw new HttpException('Comercio no encontrado', HttpStatus.NOT_FOUND);
    }

    // Validacion de email existente
    if (data.email && data.email !== found.email) {
      const exists = await this.commerceRepository.findCommerceByEmail({ email: data.email })

      if (exists) {
        throw new HttpException(
          'Ya existe un comercio con este email.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validacion de phone existente
    if (data.phone && data.phone !== found.phone) {
      const exists = await this.commerceRepository.findCommerceByPhone({ phone: data.phone })

      if (exists) {
        throw new HttpException(
          'Ya existe un comercio con este número de telefono.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const newCommerceData: CommerceUpdateData = {};

      if (data.name && data.name != found.name) {
        newCommerceData.name = data.name;
      }
      if (data.email && data.email != found.email) {
        newCommerceData.email = data.email;
      }
      if (data.phone && data.phone != found.phone) {
        newCommerceData.phone = data.phone;
      }
      if (data.address && data.address != found.address) {
        newCommerceData.address = data.address;
      }
      if (
        data.businessCategory &&
        data.businessCategory != found.businessCategory
      ) {
        newCommerceData.businessCategory = data.businessCategory;
      }

      if (Object.keys(newCommerceData).length === 0) {
        return {
          message: 'No hay datos para actualizar.',
          statusCode: HttpStatus.OK,
          data: found,
        };
      }

      const result = await this.commerceRepository.updateCommerce({
        id: found.id,
        newCommerceData: newCommerceData,
      });

      if (result === null) {
        throw new HttpException(
          'Error al actualizar el comercio, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const updatedFields = Object.keys(newCommerceData).join(', ');
      await this.activityLogService.updated({
        entityType: EntityType.COMMERCE,
        entityId: result.id,
        userId: null,
        commerceId: result.id,
        customerId: null,
        detail: `Se actualizaron los campos: ${updatedFields}.`,
      });

      return {
        message: 'Comercio actualizado con éxito',
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
