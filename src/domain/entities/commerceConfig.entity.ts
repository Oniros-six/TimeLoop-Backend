export class CommerceConfig {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public standardDurationMinutes: number,
    public allowNotifications: boolean,
    public openTime: string,
    public closeTime: string,
    public welcomeMessage: string,
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    standardDurationMinutes: number;
    allowNotifications: boolean;
    openTime: string;
    closeTime: string;
    welcomeMessage: string;
  }): CommerceConfig {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de comercio no es válido.');
    }

    if (typeof props.allowNotifications !== 'boolean') {
      throw new Error('El valor de allowNotifications debe ser un booleano.');
    }

    if (typeof props.welcomeMessage !== 'string') {
      throw new Error(
        'El valor de welcomeMessage debe ser una cadena de texto.',
      );
    }

    if (!props.standardDurationMinutes || props.standardDurationMinutes <= 0) {
      throw new Error('La duración estándar debe ser un número positivo.');
    }

    if (props.openTime >= props.closeTime) {
      throw new Error(
        'La hora de apertura debe ser anterior a la hora de cierre.',
      );
    }

    return new CommerceConfig(
      0,
      props.commerceId,
      props.standardDurationMinutes,
      props.allowNotifications,
      props.openTime,
      props.closeTime,
      props.welcomeMessage,
    );
  }
}
