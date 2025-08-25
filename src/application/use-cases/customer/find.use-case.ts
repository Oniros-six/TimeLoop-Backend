import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '@/application/providers';

@Injectable()
export class FindCustomer {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: number) {
    const customer = await this.customerRepository.findCustomer({ id: id });

    if (!customer) {
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Cliente encontrado',
      statusCode: HttpStatus.OK,
      data: customer,
    };
  }
}
