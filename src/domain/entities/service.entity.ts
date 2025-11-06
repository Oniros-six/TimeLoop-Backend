export class Service {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly durationMinutes: number,
  ) { }

  private static capitalizeFirst(rawString: string): string {
    const trimmed = rawString.trim();
    if (trimmed.length === 0) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // Factory method
  static create(props: {
    userId: number;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
  }): Service {
    const normalizedName = Service.capitalizeFirst(props.name);
    const normalizedDescription = Service.capitalizeFirst(props.description);
    return new Service(
      0,
      props.userId,
      normalizedName,
      normalizedDescription,
      props.price,
      props.durationMinutes,
    );
  }
}
