import { CommerceConfig } from '../entities/commerceConfig.entity';

export interface ICommerceConfigRepository {
  findCommerceConfig(data: { commerceId: number }): Promise<CommerceConfig>;

  createCommerceConfig(data: CommerceConfig): Promise<CommerceConfig | null>;

  updateCommerceConfig(data: {
    commerceId: number;
    newCommerceConfigData: CommerceConfig;
  }): Promise<CommerceConfig | null>;
}
