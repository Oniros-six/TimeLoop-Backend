import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { FindByCommerceDto } from '@/interfaces/controllers/customer/dto/find-customers-commerce.dto';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import {
  CUSTOMER_REPOSITORY,
  COMMERCE_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class FindAllCustomersByCommerce {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  async execute(data: FindByCommerceDto) {
    const commerce = await this.commerceRepository.findCommerce({
      commerceId: data.commerceId,
    });

    if (!commerce) {
      throw new HttpException('Comercio no encontrado', HttpStatus.NOT_FOUND);
    }

    try {
      const customers = await this.customerRepository.findCustomersByCommerce({
        commerceId: data.commerceId,
      });
      if (!customers || customers.length == 0) {
        return {
          message: 'No hay clientes asociados a este comercio.',
          statusCode: HttpStatus.OK,
          data: customers,
        };
      }

      return {
        message: 'Clientes obtenidos con éxito',
        statusCode: HttpStatus.OK,
        data: customers,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(message);
      throw new HttpException(
        'Error al obtener los clientes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
