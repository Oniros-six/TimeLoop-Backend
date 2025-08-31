import { MERCADO_PAGO_REPOSITORY } from '@/application/providers';
import { MercadoPago } from '@/domain/entities/mercadoPago.entity';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { exchangeCodeForTokens } from '@/domain/services/mercadoPago/mercadoPago.service'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreateOrRefresh {
    constructor(
        @Inject(MERCADO_PAGO_REPOSITORY)
        private readonly mercadoPagoRepository: IMercadoPagoRepository,
    ) { }

    async execute(data: { commerceId: number, code: string }) {
        try {
            //* Buscamos si ya existe un registro para este comercio
            const existing = await this.mercadoPagoRepository.findByCommerceId(data.commerceId);

            //* Obtenemos los tokens de MercadoPago
            const token = await exchangeCodeForTokens(data.commerceId, data.code);

            let result: MercadoPago;
            if (existing) {
                //* Actualizamos los tokens existentes
                result = await this.mercadoPagoRepository.update(existing.id, token);
            } else {
                //* Creamos un nuevo registro
                result = await this.mercadoPagoRepository.create(token);
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