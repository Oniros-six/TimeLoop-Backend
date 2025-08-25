import { BookingStatus } from "@/domain/common/BookingStatus"

export class Booking {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly commerceId: number,
    public readonly duration: number,
    public status: BookingStatus,
    public serviceId: number,
    public date: Date,
    public timeEnd: Date,
    public notes: string,
  ) {}

  // Solo métodos de dominio esenciales
  canBeCancelled(): boolean {
    return this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;
  }

  canBeRescheduled(): boolean {
    return this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;
  }


  static createPending(
    customerId: number,
    serviceId: number,
    commerceId: number,
    date: Date,
    timeEnd: Date,
    duration: number,
    notes: string = '',
  ): Booking {
    return new Booking(
      0, // ID será asignado por la base de datos
      customerId,
      commerceId,
      duration,
      BookingStatus.PENDING,
      serviceId,
      date,
      timeEnd,
      notes,
    );
  }

}
