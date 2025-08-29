import { CommerceUpdateData } from '../common/CommerceUpdateData';
import { Commerce } from '../entities/commerce.entity';

export interface ICommerceRepository {
  findCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  findCommerceByName(data: { name: string }): Promise<Commerce | null>;

  findCommerceByEmail(data: { email: string}): Promise<boolean>;

  findCommerceByPhone(data: { phone: string}): Promise<boolean>;

  suspendCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  reinstateCommerce(data: { commerceId: number }): Promise<Commerce | null>;

  createCommerce(data: Commerce): Promise<Commerce | null>;

  findAllActive(): Promise<Commerce[] | null>;
  
  updateCommerce(data: {
    id: number;
    newCommerceData: CommerceUpdateData;
  }): Promise<Commerce | null>;
}
