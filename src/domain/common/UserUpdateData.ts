import { Roles } from '@/application/constants/user-roles.constants';

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: Roles;
}
