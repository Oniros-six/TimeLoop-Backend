import { Payment } from "@/domain/entities/payment.entity";
import { IPaymentProvider, PaymentResult } from "../IPaymentProvider";
import { Injectable } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { RefundResponse } from "mercadopago/dist/clients/paymentRefund/commonTypes";

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
    async processPayment(payment: Payment): Promise<PaymentResult> {
        // Lógica específica de MercadoPago
        return {
            success: true,
            status: PaymentStatus.approved,
            providerRef: `MERCADO_PAGO_${payment.id}_${Date.now()}`,
            redirectUrl: "",
            error: ""
        };
    }
    async verifyPayment(paymentId: string): Promise<PaymentStatus> {
        throw new Error("Method not implemented.");
    }
    async processRefund(paymentId: string, amount: number): Promise<RefundResponse> {
        throw new Error("Method not implemented.");
    }
}