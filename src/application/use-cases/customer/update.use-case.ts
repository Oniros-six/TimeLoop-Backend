import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { UpdateCustomerDto } from '@/interfaces/controllers/customer/dto/update-customer.dto';
import { CustomerUpdateData } from '@/domain/common/CustomerUpdateData';
import { CUSTOMER_REPOSITORY } from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';

@Injectable()
export class UpdateCustomer {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(id: number, data: UpdateCustomerDto) {

    // Validate customer existence
    const customer = await this.customerRepository.findCustomer({ id: id });

    if (!customer) {
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
    }

    // Validate customer email not in use
    if (data.email && data.email !== customer.email) {
      const exists = await this.customerRepository.findCustomerByEmail({ email: data.email });

      if (exists) {
        throw new HttpException(
          'Ya existe un cliente con este email.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const newCustomerData: CustomerUpdateData = {};

      if (data.email && data.email != customer.email) {
        newCustomerData.email = data.email;
      }
      if (data.name && data.name != customer.name) {
        newCustomerData.name = data.name;
      }
      if (data.phone && data.phone != customer.phone) {
        newCustomerData.phone = data.phone;
      }

      if (Object.keys(newCustomerData).length === 0) {
        return {
          message: 'Información actualizada con exito',
          statusCode: HttpStatus.OK,
          data: customer,
        };
      }

      const result = await this.customerRepository.updateCustomer({
        id: customer.id,
        newCustomerData: newCustomerData,
      });

      if (!result) {
        throw new HttpException(
          'Error al actualizar el cliente',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const updatedFields = Object.keys(newCustomerData).join(', ');
      await this.activityLogService.updated({
        entityType: EntityType.CUSTOMER,
        entityId: result.id,
        userId: null,
        commerceId: null,
        customerId: result.id,
        detail: `Se actualizaron los campos: ${updatedFields}.`,
      });

      return {
        message: 'Información actualizada con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Error al actualizar el cliente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
