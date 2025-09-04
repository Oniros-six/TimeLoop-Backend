import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { IPaymentProvider, PaymentResult } from "./IPaymentProvider";
import { PaymentMethod } from "@/domain/dbEnums/paymentMethods";
import { Payment } from "@/domain/entities/payment.entity";
import { PAYMENT_PROVIDERS } from "@/application/providers";

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
}