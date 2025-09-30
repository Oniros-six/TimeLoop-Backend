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

  static createCommerce(props: {
    id?: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    businessCategory: BusinessCategory;
    logo?: string;
  }): Commerce {
    return new Commerce(
      props.id ?? 0,
      props.name,
      props.email,
      props.phone,
      props.address,
      props.businessCategory,
      true,
      props.logo
    );
  }
}
