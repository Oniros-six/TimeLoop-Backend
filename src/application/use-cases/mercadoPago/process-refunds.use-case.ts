import { PAYMENT_REPOSITORY } from "@/application/providers";
import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus";
import { IPaymentRepository } from "@/domain/repositories/payment.repository";
import { PaymentStateMachine } from "@/domain/value-objects/payment/PaymentStateMachine";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class ProcessRefunds {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) { }

  async execute(paymentId: number, refundAmount: number, reason: string) {
 
}