export class BookingDate {
  private readonly _value: Date;

  constructor(value: Date) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: Date): void {
    if (!value) {
      throw new Error('La fecha de reserva es requerida');
    }

    if (!(value instanceof Date)) {
      throw new Error('La fecha debe ser una instancia válida de Date');
    }

    const input = new Date(value);
    const now = new Date();

    const inputUTC = new Date(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate(),
    );

    const todayUTC = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    if (inputUTC < todayUTC) {
      throw new Error('La fecha debe ser hoy o en el futuro');
    }

    // Aditional domain's rules
    // const dayOfWeek = value.getDay();

    // Ex: Not allow to schedule on a sunday
    //TODO Use this to validate against commerce config
    // if (dayOfWeek === 0) {
    //   throw new Error('No se permiten reservas los domingos');
    // }

    // Not allow to schedule 30 days in the future
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (value > thirtyDaysFromNow) {
      throw new Error(
        'No se permiten reservas con más de 30 días de anticipación',
      );
    }
  }

  get value(): Date {
    return this._value;
  }

  isSameDate(other: BookingDate): boolean {
    return this._value.toDateString() === other._value.toDateString();
  }

  isBefore(other: BookingDate): boolean {
    return this._value < other._value;
  }

  // use this to validate commerce specific rules
  // isWeekend(): boolean {
  //   const dayOfWeek = this._value.getDay();
  //   return dayOfWeek === 0 || dayOfWeek === 6;
  // }

  // use this to validate commerce specific rules
  // isHoliday(): boolean {
  //   // Aquí podrías integrar con un servicio de feriados
  //   // Por ahora retornamos false
  //   return false;
  // }

  // getDayOfWeek(): string {
  //   const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  //   return days[this._value.getDay()];
  // }
}
