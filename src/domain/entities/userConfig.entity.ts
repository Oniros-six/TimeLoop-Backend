export class UserConfig {
  constructor(
    public readonly id: number,
    public readonly userId: number,
  ) {}

  // Factory method
  static create(props: { userId: number }): UserConfig {
    if (!props.userId || props.userId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    return new UserConfig(0, props.userId);
  }
}
