export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public password: string,
    public readonly roleId: number,
    public readonly commerceId: number,
    public active: boolean,
  ) {}

  // Factory method
  static create(props: {
    id?: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    commerceId: number;
    active?: boolean;
  }): User {
    return new User(
      0,
      props.name,
      props.email,
      props.password,
      props.roleId,
      props.commerceId,
      true,
    );
  }
}
