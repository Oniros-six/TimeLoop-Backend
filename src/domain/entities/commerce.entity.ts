import { BusinessCategory } from '../dbEnums/BusinessCategory.enum';

export class Commerce {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public businessCategory: BusinessCategory,
    public active: boolean,
    public readonly logo?: string,
  ) {}

  private static capitalizeFirst(rawName: string): string {
    const trimmed = rawName.trim();
    if (trimmed.length === 0) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  static createCommerce(props: {
    id?: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    businessCategory: BusinessCategory;
    logo?: string;
  }): Commerce {
    const normalizedName = Commerce.capitalizeFirst(props.name);
    return new Commerce(
      props.id ?? 0,
      normalizedName,
      props.email,
      props.phone,
      props.address,
      props.businessCategory,
      true,
      props.logo
    );
  }
}
