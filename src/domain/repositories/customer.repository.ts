import { CustomerUpdateData } from '../common/CustomerUpdateData';
import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  createCustomer(data: Customer): Promise<Customer | null>;

  findCustomers(): Promise<Customer[] | null>;

  findCustomer(data: { id: number }): Promise<Customer | null>;

  findCustomerByEmail(data: { email: string }): Promise<Customer | null>;

  updateCustomer(data: {
    id: number;
    newCustomerData: CustomerUpdateData;
  }): Promise<Customer | null>;
}
