import { Request } from 'express';
import { Roles } from '@/domain/dbEnums/user-roles.constants';

export interface User {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  role: Roles;
  active: boolean;
}

export interface SafeUser {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  role: Roles;
  active: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export interface LoginRequest extends Request {
  user?: User;
}
