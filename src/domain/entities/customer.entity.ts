export class Customer {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public name: string,
    public email: string,
    public phone: string,
    public internalNote: string,
  ) {}

  // Factory method
  static create(props: {
    id?: number;
    commerceId: number;
    name: string;
    email: string;
    phone: string;
    internalNote: string;
  }): Customer {
    return new Customer(
      props.id ?? 0,
      props.commerceId,
      props.name,
      props.email,
      props.phone,
      props.internalNote,
    );
  }
}
