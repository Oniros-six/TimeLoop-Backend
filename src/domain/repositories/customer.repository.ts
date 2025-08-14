import { CustomerUpdateData } from '../common/CustomerUpdateData';
import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    internalNote: string;
    commerceId: number;
  }): Promise<Customer | null>;

  findCustomersByCommerce(data: {
    commerceId: number;
  }): Promise<Customer[] | null>;

  findCustomer(data: { id: number }): Promise<Customer | null>;

  findCustomerByEmailAndCommerce(data: {
    email: string;
    commerceId: number;
  }): Promise<Customer | null>;

  updateCustomer(data: {
    id: number;
    newCustomerData: CustomerUpdateData;
  }): Promise<Customer | null>;
}
