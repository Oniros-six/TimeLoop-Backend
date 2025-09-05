import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { CreateCustomerDto } from '@/interfaces/controllers/customer/dto/create-customer.dto';
import { Customer as CustomerDomain } from '@/domain/entities/customer.entity';
import { CUSTOMER_REPOSITORY } from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';

@Injectable()
export class CreateCustomer {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,

    private readonly activityLogService: ActivityLogService,
  ) { }

  async execute(data: CreateCustomerDto) {
    const found = await this.customerRepository.findCustomerByEmail({
      email: data.email,
    });

    if (found) {
      const customer = CustomerDomain.create({
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
      });
      return customer;
    }

    try {
      const customer = CustomerDomain.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      // Create customer
      const result = await this.customerRepository.createCustomer(customer);

      if (result === null) {
        throw new HttpException(
          'Error al registrar el cliente, intente de nuevo en unos minutos.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.activityLogService.created({
        entityType: EntityType.CUSTOMER,
        entityId: result.id,
        userId: null,
        commerceId: null,
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
