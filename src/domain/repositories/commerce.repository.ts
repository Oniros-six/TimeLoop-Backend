import { Commerce } from '../entities/commerce.entity';

export interface ICommerceRepository {
  findCommerce(data: { commerceId: number }): Promise<Commerce | null>;
}
