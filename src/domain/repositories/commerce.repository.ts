import { CommerceUpdateData } from '../common/CommerceUpdateData';
import { Commerce } from '../entities/commerce.entity';

export interface ICommerceRepository {
  findCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  suspendCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  reinstateCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  createCommerce(data: Commerce): Promise<Commerce | null>;

  updateCommerce(data: {
    id: number;
    newCommerceData: CommerceUpdateData;
  }): Promise<Commerce | null>;

  findCommerceByName(data: { name: string }): Promise<Commerce | null>;
}
