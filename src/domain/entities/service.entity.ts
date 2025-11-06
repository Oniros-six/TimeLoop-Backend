import { ServiceUpdateData } from '../common/ServiceUpdateData';

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

  // Returns the normalized partial update with only changed fields
  diffFrom(update: {
    name?: string;
    description?: string;
    price?: number;
    durationMinutes?: number;
  }): ServiceUpdateData {
    const changes: ServiceUpdateData = {};

    if (typeof update.name === 'string') {
      const normalized = Service.capitalizeFirst(update.name);
      if (normalized !== this.name) {
        changes.name = normalized;
      }
    }

    if (typeof update.description === 'string') {
      const normalized = Service.capitalizeFirst(update.description);
      if (normalized !== this.description) {
        changes.description = normalized;
      }
    }

    if (typeof update.price === 'number') {
      if (update.price !== this.price) {
        changes.price = update.price;
      }
    }

    if (typeof update.durationMinutes === 'number') {
      if (update.durationMinutes !== this.durationMinutes) {
        changes.durationMinutes = update.durationMinutes;
      }
    }

    return changes;
  }
}
