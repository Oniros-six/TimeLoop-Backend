import { Request } from 'express';

export interface User {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  roleId: number;
  active: boolean;
}

export interface SafeUser {
  id: number;
  commerceId: number;
  email: string;
  name: string;
  role: number; // Note: this is roleId mapped to role
  active: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export interface LoginRequest extends Request {
  user?: User;
}
