import { SetMetadata } from '@nestjs/common';
import { ROLES } from '@/application/constants/user-roles.constants';

export const Roles = (...roles: number[]) => SetMetadata('roles', roles);

// Decoradores predefinidos para roles comunes
export const RequireAdmin = () => Roles(ROLES.ADMIN);
export const RequireEmployee = () => Roles(ROLES.EMPLOYEE);
export const RequireAdminOrEmployee = () => Roles(ROLES.ADMIN, ROLES.EMPLOYEE);
