import { MercadoPago } from '@/domain/entities/mercadoPago.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  public_key?: string;
  user_id: string;
  expires_in: number;
}

interface ExchangeTokenResponse {
  accessToken: string;
  refreshToken: string;
  publicKey: string | null;
  mpUserId: string;
  tokenExpires: Date;
}

@Injectable()
export class MercadoPagoService {
  constructor(private readonly httpService: HttpService) {}

  async exchangeCodeForTokens(
    commerceId: number,
    code: string,
  ): Promise<ExchangeTokenResponse> {
    try {
      const url = 'https://api.mercadopago.com/oauth/token';

      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          url,
          {
            client_secret: process.env.MP_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.MP_REDIRECT_URI,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      const data: TokenResponse = response.data;

      const tokenInstance = MercadoPago.createTokens({
        commerceId: commerceId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? '',
        publicKey: data.public_key ?? '',
        mpUserId: data.user_id,
        tokenExpires: new Date(Date.now() + data.expires_in * 1000),
      });
      return tokenInstance;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Error al obtener tokens de MP';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  async getPayment(paymentId: string, accessToken: string): Promise<any> {
    try {
      const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Error al consultar pago en MercadoPago';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  async getPreference(preferenceId: string, accessToken: string): Promise<any> {
    try {
      const url = `https://api.mercadopago.com/checkout/preferences/${preferenceId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Error al consultar preference en MercadoPago';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<ExchangeTokenResponse> {
    try {
      const url = 'https://api.mercadopago.com/oauth/token';

      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          url,
          {
            client_secret: process.env.MP_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      const data: TokenResponse = response.data;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken, // Mantener el anterior si no hay uno nuevo
        publicKey: data.public_key ?? null,
        mpUserId: data.user_id,
        tokenExpires: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Error al refrescar token de MP';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }
}
