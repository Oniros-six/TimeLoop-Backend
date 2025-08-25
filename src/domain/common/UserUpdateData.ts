import { Roles } from '@/domain/dbEnums/user-roles.constants';

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: Roles;
}
