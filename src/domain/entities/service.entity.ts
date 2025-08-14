export class Service {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly name: string,
    public readonly price: number,
    public readonly durationMinutes: number,
  ) {}
}
