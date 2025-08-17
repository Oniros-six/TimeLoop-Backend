import { CommerceWorkingOverride } from '../entities/commerceWorkingOverride.entity';

export interface ICommerceWorkingOverrideRepository {
  findCommerceWorkingOverride(data: {
    commerceId: number;
  }): Promise<CommerceWorkingOverride[] | null>;

  findCommerceWorkingOverrideById(data: {
    id: number;
  }): Promise<CommerceWorkingOverride | null>;

  createCommerceWorkingOverride(
    data: CommerceWorkingOverride,
  ): Promise<CommerceWorkingOverride | null>;

  verifyCommerceWorkingOverride(data: {
    commerceId: number;
    date: Date;
  }): Promise<boolean>;

  updateCommerceWorkingOverride(data: {
    id: number;
    newCommerceWorkingOverrideData: CommerceWorkingOverride;
  }): Promise<CommerceWorkingOverride | null>;
}
