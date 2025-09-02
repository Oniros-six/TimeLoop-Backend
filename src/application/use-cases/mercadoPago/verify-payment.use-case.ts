import { MERCADO_PAGO_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { MercadoPagoService } from '@/domain/services/mercadoPago/mercadoPago.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class VerifyPayment {
    constructor(
        @Inject(MERCADO_PAGO_REPOSITORY)
        private readonly mercadoPagoRepository: IMercadoPagoRepository,

        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,

        private readonly mercadoPagoService: MercadoPagoService,
    ) { }

    async execute(paymentId: string) {

        //* 1. Buscar en la DB el pago para ver a qué booking/comercio pertenece
        const payment = await this.paymentRepository.findByProviderRef(paymentId);
        if (!payment) {
            throw new Error(`No existe un pago con id ${paymentId}`);
        }

        const commerceId = payment.commerceId;

        //* 2. Recuperar el access token del comercio
        const mpCredentials = await this.mercadoPagoRepository.findByCommerceId(commerceId);
        if (!mpCredentials) {
            throw new Error(`El comercio ${commerceId} no tiene credenciales de MercadoPago`);
        }

        const accessToken = mpCredentials.accessToken;

        //* 3. Consultar a MP el estado del pago
        const paymentData = await this.mercadoPagoService.getPayment(paymentId, accessToken);

        //* 4. Actualizar el estado en tu DB
        await this.paymentRepository.updateStatus(payment.id, paymentData.status);

        //* 5. Retornar lo que necesites (por ej, el nuevo estado)
        return {
            paymentId,
            status: paymentData.status,
            detail: paymentData,
        };
    }
}
