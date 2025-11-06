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

  private static capitalizeName(rawName: string): string {
    const trimmedName = rawName.trim();
    if (trimmedName.length === 0) return trimmedName;
    return trimmedName
      .split(/\s+/)
      .map((word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(' ');
  }

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
    const normalizedName = User.capitalizeName(props.name);
    return new User(
      0,
      normalizedName,
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
      this.name = User.capitalizeName(props.name);
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
