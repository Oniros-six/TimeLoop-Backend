import { Currency } from '@/domain/dbEnums/Currency.enum';
import { PaymentMethod } from '@/domain/dbEnums/PaymentMethods.enum';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';

export class Payment {
  constructor(
    public readonly id: number,
    public readonly bookingId: number,
    public readonly commerceId: number,
    public amount: number,
    public currency: Currency,
    public status: PaymentStatus,
    public method: PaymentMethod,
    public createdAt: Date,
    public updatedAt: Date | null,
    public providerRef: string | null,
    public refundedAt: Date | null,
  ) {}

  // Factory method
  static create(props: {
    bookingId: number;
    commerceId: number;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    method: PaymentMethod;
    createdAt: Date;
    updatedAt: Date | null;
    providerRef: string | null;
    refundedAt: Date | null;
  }): Payment {
    return new Payment(
      0,
      props.bookingId,
      props.commerceId,
      props.amount,
      props.currency,
      props.status,
      props.method,
      props.createdAt,
      props.updatedAt,
      props.providerRef,
      props.refundedAt,
    );
  }
}
