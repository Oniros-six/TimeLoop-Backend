import { Injectable, Inject } from '@nestjs/common';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { MERCADO_PAGO_REPOSITORY } from '@/application/providers';
import { MercadoPagoService } from './mercadoPago.service';
import { MercadoPago } from '@/domain/entities/mercadoPago.entity';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  publicKey: string | null;
  mpUserId: string;
  tokenExpires: Date;
}

@Injectable()
export class TokenValidationService {
  constructor(
    @Inject(MERCADO_PAGO_REPOSITORY)
    private readonly mercadoPagoRepository: IMercadoPagoRepository,

    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async validateAndRefreshToken(commerceId: number): Promise<string> {
    try {
      const credentials =
        await this.mercadoPagoRepository.findByCommerceId(commerceId);

      // Verificar si el token expira en los próximos 5 minutos
      const now = new Date();
      const expirationTime = new Date(credentials.tokenExpires);
      const timeUntilExpiration = expirationTime.getTime() - now.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;

      if (timeUntilExpiration <= fiveMinutesInMs) {
        console.log(
          `Token para comercio ${commerceId} expira pronto, refrescando...`,
        );
        return await this.refreshToken(credentials);
      }

      return credentials.accessToken;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(
        `Error validando token para comercio ${commerceId}: ${message}`,
      );
    }
  }

  /**
   * Refresca un token usando el refresh token
   */
  private async refreshToken(credentials: MercadoPago): Promise<string> {
    try {
      const newTokens: RefreshTokenResponse =
        await this.mercadoPagoService.refreshAccessToken(
          credentials.refreshToken,
        );

      // Crear el token en el formato esperado por el repositorio
      const tokenInstance = new MercadoPago.Token(
        credentials.commerceId,
        newTokens.accessToken,
        newTokens.refreshToken,
        newTokens.publicKey,
        newTokens.mpUserId,
        newTokens.tokenExpires,
      );

      await this.mercadoPagoRepository.update(credentials.id, tokenInstance);
      return newTokens.accessToken;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error refrescando token: ${message}`);
    }
  }

  /**
   * Verifica si un token está expirado
   */
  isTokenExpired(tokenExpires: Date): boolean {
    const now = new Date();
    return now >= tokenExpires;
  }

  /**
   * Obtiene el tiempo restante hasta la expiración en minutos
   */
  getTimeUntilExpiration(tokenExpires: Date): number {
    const now = new Date();
    const timeUntilExpiration = tokenExpires.getTime() - now.getTime();
    return Math.floor(timeUntilExpiration / (1000 * 60)); // minutos
  }
}
