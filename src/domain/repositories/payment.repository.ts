import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';
import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(id: number): Promise<Payment | null>;
  findByBookingId(bookingId: number): Promise<Payment[]>;
  findByProviderRef(ref: string): Promise<Payment>;
  updateStatus(id: number, status: Payment['status']): Promise<Payment>;
  update(
    id: number,
    {
      externalPaymentId,
      status,
    }: { externalPaymentId: string | undefined; status: PaymentStatus },
  ): Promise<Payment>;
}
