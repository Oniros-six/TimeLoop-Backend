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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@/infrastructure/auth/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @UseGuards(PassportAuthGuard('local'))
  @Post('login')
  async login(@Req() req: Request & { user?: any }) {
    return {
      message: 'Login exitoso',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.roleId,
        commerceId: req.user.commerceId,
        active: req.user.active,
      },
    };
  }

  @ApiOperation({ summary: 'Verificar estado de autenticación' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: Request & { user?: any }) {
    return {
      message: 'Usuario autenticado',
      user: req.user,
    };
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  @Post('logout')
  async logout(@Req() req: Request & { user?: any }, @Res() res: Response) {
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
