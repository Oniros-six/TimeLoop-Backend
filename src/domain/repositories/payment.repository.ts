import { Payment } from "../entities/payment.entity";

export interface IPaymentRepository {
    create(payment: Payment): Promise<Payment>;
    findById(id: number): Promise<Payment | null>;
    findByBookingId(bookingId: number): Promise<Payment[]>;
    updateStatus(id: number, status: Payment['status']): Promise<Payment>;
}
