import { Payment } from "@/domain/entities/payment.entity";
import { Injectable } from "@nestjs/common";
import { IPaymentProvider, PaymentResult } from "../IPaymentProvider";
import { RefundResponse } from "mercadopago/dist/clients/paymentRefund/commonTypes";
import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus";

@Injectable()
export class CashProvider implements IPaymentProvider {
    async processPayment(payment: Payment): Promise<PaymentResult> {
        // Lógica para pagos en efectivo
        return {
            success: true,
            status: PaymentStatus.approved,
            providerRef: `CASH_${payment.id}_${Date.now()}`,
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