import { Roles } from '@/application/constants/user-roles.constants';

export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public password: string,
    public readonly role: Roles,
    public readonly commerceId: number,
    public active: boolean,
  ) {}

  // Factory method
  static create(props: {
    id?: number;
    name: string;
    email: string;
    password: string;
    role: Roles;
    commerceId: number;
    active?: boolean;
  }): User {
    return new User(
      0,
      props.name,
      props.email,
      props.password,
      props.role,
      props.commerceId,
      true,
    );
  }
}
