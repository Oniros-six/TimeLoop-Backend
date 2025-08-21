import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.isAuthenticated()) {
      throw new UnauthorizedException(
        'Debe iniciar sesión para acceder a este recurso',
      );
    }

    return true;
  }
}
