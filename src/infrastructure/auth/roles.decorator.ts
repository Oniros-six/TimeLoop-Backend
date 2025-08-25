import { SetMetadata } from '@nestjs/common';
import { Roles as RolesEnum } from '@/domain/dbEnums/user-roles.constants';

export const Roles = (...roles: RolesEnum[]) => SetMetadata('roles', roles);

// Decoradores predefinidos para roles comunes
export const RequireAdmin = () => Roles(RolesEnum.ADMIN);
export const RequireEmployee = () => Roles(RolesEnum.EMPLOYEE);
export const RequireAdminOrEmployee = () =>
  Roles(RolesEnum.ADMIN, RolesEnum.EMPLOYEE);
