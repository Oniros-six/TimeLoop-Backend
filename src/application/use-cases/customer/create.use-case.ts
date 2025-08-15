import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { CreateCustomerDto } from '@/interfaces/controllers/customer/dto/create-customer.dto';
import { Customer as CustomerDomain } from '@/domain/entities/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  COMMERCE_REPOSITORY,
} from '@/application/constants/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { ENTITY_TYPES } from '@/application/constants/activity-log.constants';

@Injectable()
export class CreateCustomer {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,

    private readonly activityLogService: ActivityLogService,
  ) {}

  async execute(data: CreateCustomerDto) {
    // Validate that the commerce exists
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
    }

    const found = await this.customerRepository.findCustomerByEmailAndCommerce({
      email: data.email,
      commerceId: data.commerceId,
    });
    if (found) {
      const customer = CustomerDomain.create({
        id: found.id,
        commerceId: found.commerceId,
        name: found.name,
        email: found.email,
        phone: found.phone,
        internalNote: found.internalNote,
      });
      return customer;
    }

    try {
      const customer = CustomerDomain.create({
        commerceId: data.commerceId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        internalNote: data.internalNote || '',
      });

      // Create customer
      const result = await this.customerRepository.createCustomer({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        internalNote: customer.internalNote,
        commerceId: customer.commerceId,
      });

      if (result === null) {
        throw new HttpException(
          'Error al registrar el cliente, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityTypeId: ENTITY_TYPES.CUSTOMER,
        entityId: result.id,
        userId: null,
        commerceId: result.commerceId,
        customerId: result.id,
        detail: `El cliente ${result.name} fue creado.`,
      });

      return {
        message: 'Cliente creado con éxito',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Algo salió mal al guardar los datos del cliente, inténtelo de nuevo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
