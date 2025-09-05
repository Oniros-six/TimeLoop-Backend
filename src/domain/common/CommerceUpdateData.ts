import { BusinessCategory } from '@/domain/dbEnums/BusinessCategory.enum';

export interface CommerceUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessCategory?: BusinessCategory;
}
