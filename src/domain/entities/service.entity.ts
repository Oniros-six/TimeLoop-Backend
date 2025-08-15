export class Service {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly name: string,
    public readonly price: number,
    public readonly durationMinutes: number,
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    name: string;
    price: number;
    durationMinutes: number;
  }): Service {
    return new Service(
      0,
      props.commerceId,
      props.name,
      props.price,
      props.durationMinutes,
    );
  }
}
