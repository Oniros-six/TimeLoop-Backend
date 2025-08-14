import { BookingDate } from '../value-objects/booking/booking-date.vo';
import { BookingTime } from '../value-objects/booking/booking-time.vo';
import { BookingStatus } from '../value-objects/booking/booking-status.vo';

export class Booking {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly commerceId: number,
    public readonly duration: number,
    public status: BookingStatus,
    public serviceId: number,
    public date: BookingDate,
    public timeStart: BookingTime,
    public notes: string,
  ) {
    this.timeEnd = this.timeStart.addMinutes(this.duration);
  }

  public timeEnd: BookingTime;

  // Solo métodos de dominio esenciales
  canBeCancelled(): boolean {
    return this.status.value === 'confirmed' || this.status.value === 'pending';
  }

  canBeRescheduled(): boolean {
    return this.status.value === 'confirmed' || this.status.value === 'pending';
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('No se puede cancelar esta reserva');
    }
    this.status = new BookingStatus('cancelled');
  }

  static createPending(
    customerId: number,
    serviceId: number,
    commerceId: number,
    date: Date,
    timeStart: Date,
    duration: number,
    notes: string = '',
  ): Booking {
    return new Booking(
      0, // ID será asignado por la base de datos
      customerId,
      commerceId,
      duration,
      new BookingStatus('pending'),
      serviceId,
      new BookingDate(date),
      new BookingTime(timeStart),
      notes,
    );
  }
}
