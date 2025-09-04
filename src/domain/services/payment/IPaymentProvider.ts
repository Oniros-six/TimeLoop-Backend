import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus";
import { Payment } from "@/domain/entities/payment.entity";
import { RefundResponse } from "mercadopago/dist/clients/paymentRefund/commonTypes";

export interface IPaymentProvider {
    processPayment(payment: Payment): Promise<PaymentResult>;
    processRefund(paymentProviderRef: string, refundAmount: number, commerceId: number): Promise<RefundResponse>;
    // getPaymentDetails(paymentId: string): Promise<PaymentDetails>;
  }
  
  export interface PaymentResult {
    success: boolean;
    providerRef?: string;
    redirectUrl?: string;
    status: PaymentStatus;
    error?: string | null;
  }