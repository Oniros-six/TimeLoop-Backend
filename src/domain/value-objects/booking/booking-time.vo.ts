export class BookingTime {
  private readonly _value: Date;

  constructor(value: Date) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: Date): void {
    if (!value) {
      throw new Error('El horario de inicio es requerido');
    }

    if (!(value instanceof Date)) {
      throw new Error('El horario debe ser una instancia válida de Date');
    }

    const now = new Date();

    // Convert both dates to UTC "day start"
    const inputUTC = new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
    const todayUTC = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    // Same day UTC: The hour should be in the future respect now
    if (inputUTC.getTime() === todayUTC.getTime()) {
      if (value.getTime() <= now.getTime()) {
        throw new Error(
          'La fecha debe ser hoy con hora futura, o una fecha posterior',
        );
      }
    }

    //* Future date validation is handled by BookingDate

    // Aditional Domain's Rules
    // const hours = value.getHours();
    // const minutes = value.getMinutes();

    // Commerce working hours validation
    // *Later use this to validate against especific commerce
    // if (hours < 8 || hours >= 20) {
    //   throw new Error('El horario debe estar entre 8:00 AM y 8:00 PM');
    // }

    // // Validar intervalos de 15 minutos (regla de negocio)
    // if (minutes % 15 !== 0) {
    //   throw new Error('El horario debe ser en intervalos de 15 minutos');
    // }

    // Validate if the commerce acepts shedule on break time
    // if (hours === 12) {
    //   throw new Error('No se permiten reservas durante el horario de almuerzo (12:00-13:00)');
    // }
  }

  get value(): Date {
    return this._value;
  }

  getHours(): number {
    return this._value.getHours();
  }

  getMinutes(): number {
    return this._value.getMinutes();
  }

  isBefore(other: BookingTime): boolean {
    return this._value < other._value;
  }

  addMinutes(minutes: number): BookingTime {
    const newTime = new Date(this._value.getTime() + minutes * 60000);
    return new BookingTime(newTime);
  }

  // Métodos de dominio específicos
  isLunchTime(): boolean {
    const hours = this._value.getHours();
    return hours >= 12 && hours < 13;
  }

  isAfternoon(): boolean {
    const hours = this._value.getHours();
    return hours >= 13 && hours < 18;
  }

  isEvening(): boolean {
    const hours = this._value.getHours();
    return hours >= 18 && hours < 20;
  }

  getTimeSlot(): string {
    const hours = this._value.getHours();
    if (hours < 12) return 'mañana';
    if (hours < 18) return 'tarde';
    return 'noche';
  }
}
