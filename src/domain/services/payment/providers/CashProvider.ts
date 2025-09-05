import { Payment } from '@/domain/entities/payment.entity';
import { Injectable } from '@nestjs/common';
import { IPaymentProvider, PaymentResult } from '../IPaymentProvider';
import { RefundResponse } from 'mercadopago/dist/clients/paymentRefund/commonTypes';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';

@Injectable()
export class CashProvider implements IPaymentProvider {
  async processPayment(payment: Payment): Promise<PaymentResult> {
    // Lógica para pagos en efectivo
    return Promise.resolve({
      success: true,
      status: PaymentStatus.approved,
      providerRef: `CASH_${payment.id}_${Date.now()}`,
      redirectUrl: '',
      error: '',
    });
  }

  //** Metodo sin definir */
  async verifyPayment(_paymentId: string): Promise<PaymentStatus> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  //** Metodo sin definir */
  async processRefund(
    _paymentId: string,
    _amount: number,
  ): Promise<RefundResponse> {
    return Promise.reject(new Error('Method not implemented.'));
  }
}
