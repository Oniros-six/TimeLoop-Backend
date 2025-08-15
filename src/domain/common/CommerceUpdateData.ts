import { BusinessCategory } from './BusinessCategory';

export interface CommerceUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessCategory?: BusinessCategory;
}
