import { PaymentMethod } from '../dbEnums/PaymentMethods.enum';

export class CommerceConfig {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public cancellationDeadlineMinutes: number,
    public welcomeMessage: string,
    public acceptedPaymentMethods: PaymentMethod[],
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    cancellationDeadlineMinutes: number;
    welcomeMessage: string;
    acceptedPaymentMethods: PaymentMethod[];
  }): CommerceConfig {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de comercio no es válido.');
    }

    if (typeof props.welcomeMessage !== 'string') {
      throw new Error(
        'El valor de welcomeMessage debe ser una cadena de texto.',
      );
    }

    if (
      !props.cancellationDeadlineMinutes ||
      props.cancellationDeadlineMinutes <= 0
    ) {
      throw new Error('El tiempo debe ser un número positivo.');
    }

    return new CommerceConfig(
      0,
      props.commerceId,
      props.cancellationDeadlineMinutes,
      props.welcomeMessage,
      props.acceptedPaymentMethods,
    );
  }
}
