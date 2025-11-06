export class Customer {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public phone: string,
  ) {}

  private static capitalizeName(rawName: string): string {
    const trimmedName = rawName.trim();
    if (trimmedName.length === 0) return trimmedName;
    return trimmedName
      .split(/\s+/)
      .map((word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(' ');
  }

  // Factory method
  static create(props: {
    id?: number;
    name: string;
    email: string;
    phone: string;
  }): Customer {
    const normalizedName = Customer.capitalizeName(props.name);
    return new Customer(
      props.id ?? 0,
      normalizedName,
      props.email,
      props.phone,
    );
  }
}
