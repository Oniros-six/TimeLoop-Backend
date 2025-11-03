import { Request } from 'express';
import { Roles } from '@/domain/dbEnums/UserRoles.enum';

export interface User {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  phone: string | null;
  role: Roles;
  active: boolean;
}

export interface SafeUser {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  phone: string | null;
  role: Roles;
  active: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export interface LoginRequest extends Request {
  user?: User;
}
