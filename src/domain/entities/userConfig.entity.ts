export class UserConfig {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public darkMode: boolean,
    public reminder: boolean,
    public reminderFrequency: number,
  ) {}

  // Factory method
  static create(props: {
    userId: number;
    darkMode: boolean;
    reminder: boolean;
    reminderFrequency: number;
  }): UserConfig {
    if (!props.userId || props.userId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    if (typeof props.darkMode !== 'boolean') {
      throw new Error('El valor de darkMode debe ser un booleano.');
    }

    if (typeof props.reminder !== 'boolean') {
      throw new Error('El valor de reminder debe ser un booleano.');
    }

    if (
      props.reminder &&
      (!props.reminderFrequency || props.reminderFrequency <= 0)
    ) {
      throw new Error(
        'La frecuencia de recordatorio debe ser un número positivo si los recordatorios están activados.',
      );
    }

    return new UserConfig(
      0,
      props.userId,
      props.darkMode,
      props.reminder,
      props.reminder ? props.reminderFrequency : 0,
    );
  }
}
