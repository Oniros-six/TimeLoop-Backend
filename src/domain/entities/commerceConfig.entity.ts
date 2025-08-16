export class CommerceConfig {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public standardDurationMinutes: number,
    public allowCancel: boolean,
    public allowReschedule: boolean,
    public allowNotifications: boolean,
    public openTime: Date,
    public closeTime: Date,
    public welcomeMessage: string,
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    standardDurationMinutes: number;
    allowCancel: boolean;
    allowReschedule: boolean;
    allowNotifications: boolean;
    openTime: Date;
    closeTime: Date;
    welcomeMessage: string;
  }): CommerceConfig {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de comercio no es válido.');
    }

    if (typeof props.allowCancel !== 'boolean') {
      throw new Error('El valor de allowCancel debe ser un booleano.');
    }

    if (typeof props.allowReschedule !== 'boolean') {
      throw new Error('El valor de allowReschedule debe ser un booleano.');
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
      props.allowCancel,
      props.allowReschedule,
      props.allowNotifications,
      props.openTime,
      props.closeTime,
      props.welcomeMessage,
    );
  }
}
