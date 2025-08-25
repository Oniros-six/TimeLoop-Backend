export class Customer {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public phone: string,
  ) {}

  // Factory method
  static create(props: {
    id?: number;
    name: string;
    email: string;
    phone: string;
  }): Customer {
    return new Customer(
      props.id ?? 0,
      props.name,
      props.email,
      props.phone,
    );
  }
}
