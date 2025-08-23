import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@/infrastructure/auth/auth.guard';
import { AuthenticatedRequest, LoginRequest } from '@/domain/common/auth.types';
import { LoginUserDto } from './dto/login-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiBody({
    type: LoginUserDto,
    description: 'Credenciales del usuario necesarias para iniciar sesión',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de credenciales válidas',
        value: {
          email: 'usuario@dominio.com',
          password: 'securePass123',
        },
      },
    },
  })
  @UseGuards(PassportAuthGuard('local'))
  @Post('login')
  async login(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) {
      throw new InternalServerErrorException('Usuario no encontrado');
    }

    return new Promise((resolve, reject) => {
      // Passport login
      req.login(user, { session: true }, (err) => {
        if (err) return reject(err);

        // Forzar guardar sesión antes de responder
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Error guardando sesión:', saveErr);
            return reject(new InternalServerErrorException('Error guardando sesión'));
          }

          resolve({
            message: 'Login exitoso',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              commerceId: user.commerceId,
              active: user.active,
            },
          });
        });
      });
    });
  }

  @ApiOperation({ summary: 'Verificar estado de autenticación' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @UseGuards(AuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Usuario autenticado',
      user: req.user,
    };
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          reject(new InternalServerErrorException('Error al cerrar sesión'));
          return;
        }

        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            reject(
              new InternalServerErrorException('Error al destruir la sesión'),
            );
            return;
          }

          res.clearCookie('connect.sid'); // borra la cookie en cliente
          resolve(res.json({ message: 'Logout exitoso' }));
        });
      });
    });
  }
}
