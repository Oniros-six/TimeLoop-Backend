import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { IPaymentProvider, PaymentResult } from "./IPaymentProvider";
import { PaymentMethod } from "@/domain/dbEnums/paymentMethods";
import { Payment } from "@/domain/entities/payment.entity";
import { PAYMENT_PROVIDERS } from "@/application/providers";
import { RefundResponse } from "mercadopago/dist/clients/paymentRefund/commonTypes";

@Injectable()
export class PaymentOrchestratorService {
    constructor(
        @Inject(PAYMENT_PROVIDERS)
        private providers: Map<PaymentMethod, IPaymentProvider>,
    ) { }

    async processPaymentWithProvider(payment: Payment): Promise<PaymentResult> {
        const provider = this.providers.get(payment.method);
        if (!provider) {
            throw new HttpException(
                `El metodo de pago ${payment.method} no esta soportado`,
                HttpStatus.BAD_REQUEST
            );
        }
        return provider.processPayment(payment);
    }

    async processRefundWithProvider(
        payment: Payment, 
        refundAmount: number
    ): Promise<RefundResponse> {
        const provider = this.providers.get(payment.method);
        if (!provider) {
            throw new HttpException(
                `El metodo de pago ${payment.method} no esta soportado`,
                HttpStatus.BAD_REQUEST
            );
        }

        if (!payment.providerRef) {
            throw new HttpException(
                'El pago no tiene referencia del proveedor',
                HttpStatus.BAD_REQUEST
            );
        }

        return provider.processRefund(payment.providerRef, refundAmount, payment.commerceId);
    }
}