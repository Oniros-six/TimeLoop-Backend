import { HttpException, HttpStatus } from "@nestjs/common";
import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus";

export class PaymentStateMachine {
    private static readonly VALID_TRANSITIONS = {
      [PaymentStatus.pending]: [PaymentStatus.approved, PaymentStatus.rejected],
      [PaymentStatus.approved]: [PaymentStatus.refunded],
      [PaymentStatus.rejected]: [],
      [PaymentStatus.refunded]: []
    };

    static canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
      const validTransitions = (this.VALID_TRANSITIONS as Record<string, PaymentStatus[]>)[from];
      return validTransitions ? validTransitions.includes(to) : false;
    }
  
    static validateTransition(from: PaymentStatus, to: PaymentStatus): void {
      if (!this.canTransition(from, to)) {
        throw new HttpException(`El estado ${from} no puede ser convertido a ${to}`, HttpStatus.BAD_REQUEST);
      }
    }
  }