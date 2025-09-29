export class Service {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly durationMinutes: number,
  ) { }

  // Factory method
  static create(props: {
    userId: number;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
  }): Service {
    return new Service(
      0,
      props.userId,
      props.name,
      props.description,
      props.price,
      props.durationMinutes,
    );
  }
}
