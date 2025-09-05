import { Payment } from '@/domain/entities/payment.entity';
import { Injectable } from '@nestjs/common';
import { IPaymentProvider, PaymentResult } from '../IPaymentProvider';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';

@Injectable()
export class CashProvider implements IPaymentProvider {

  async processPayment(payment: Payment): Promise<PaymentResult> {
    try {
      // Para pagos en efectivo, simplemente generamos un providerRef único
      // El Payment ya fue creado y guardado en el use case
      const providerRef = `CASH_${payment.id}_${Date.now()}`;

      return {
        success: true,
        status: PaymentStatus.pending,
        providerRef: providerRef,
        redirectUrl: '',
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.rejected,
        providerRef: undefined,
        redirectUrl: '',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
