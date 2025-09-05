import { MERCADO_PAGO_REPOSITORY } from '@/application/providers';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { MercadoPagoService } from '@/domain/services/mercadoPago/mercadoPago.service';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreateOrRefresh {
  constructor(
    @Inject(MERCADO_PAGO_REPOSITORY)
    private readonly mercadoPagoRepository: IMercadoPagoRepository,

    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(data: { commerceId: number; code: string }) {
    try {
      //* Buscamos si ya existe un registro para este comercio
      const existing = await this.mercadoPagoRepository.findByCommerceId(
        data.commerceId,
      );

      //* Obtenemos los tokens de MercadoPago
      const token = await this.mercadoPagoService.exchangeCodeForTokens(
        data.commerceId,
        data.code,
      );

      if (existing) {
        //* Actualizamos los tokens existentes
        await this.mercadoPagoRepository.update(existing.id, {
          ...token,
          commerceId: data.commerceId,
        });
      } else {
        //* Creamos un nuevo registro
        await this.mercadoPagoRepository.create({
          ...token,
          commerceId: data.commerceId,
        });
      }

      return {
        message: 'Se conecto exitosamente la cuenta de Mercado Pago',
        statusCode: HttpStatus.OK,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('CreateOrRefresh MercadoPago:', message);
      throw new HttpException(
        'No se pudo conectar con MercadoPago, inténtelo más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
