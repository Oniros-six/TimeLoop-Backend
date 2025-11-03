import { Roles } from '@/domain/dbEnums/UserRoles.enum';

export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public password: string,
    public role: Roles,
    public phone: string | null,
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
    phone: string | null;
    commerceId: number;
    active?: boolean;
  }): User {
    return new User(
      0,
      props.name,
      props.email,
      props.password,
      props.role,
      props.phone,
      props.commerceId,
      true,
    );
  }

  update(
    props: Partial<Pick<User, 'name' | 'email' | 'password' | 'role' | 'phone'>>,
  ): boolean {
    let hasChanges = false;
    if (props.name !== undefined && props.name !== this.name) {
      this.name = props.name;
      hasChanges = true;
    }

    if (props.email !== undefined && props.email !== this.email) {
      this.email = props.email;
      hasChanges = true;
    }

    if (props.password !== undefined && props.password !== this.password) {
      this.password = props.password;
      hasChanges = true;
    }

    if (props.role !== undefined && props.role !== this.role) {
      this.role = props.role;
      hasChanges = true;
    }

    if (props.phone !== undefined && props.phone !== this.phone) {
      this.phone = props.phone;
      hasChanges = true;
    }

    return hasChanges;
  }
}
