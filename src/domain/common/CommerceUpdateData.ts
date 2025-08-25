import { BusinessCategory } from '@/domain/dbEnums/BusinessCategory';

export interface CommerceUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessCategory?: BusinessCategory;
}
