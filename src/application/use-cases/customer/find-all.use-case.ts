import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '@/application/providers';

@Injectable()
export class FindAllCustomers {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute() {
    try {
      const customers = await this.customerRepository.findCustomers();
      if (!customers || customers.length == 0) {
        return {
          message: 'No hay clientes.',
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
