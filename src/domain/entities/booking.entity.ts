import { BookingStatus } from "@/domain/dbEnums/BookingStatus"

export class Booking {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly commerceId: number,
    public readonly duration: number,
    public userId: number,
    public status: BookingStatus,
    public serviceId: number,
    public timeStart: Date,
    public timeEnd: Date,
    public notes: string,
  ) { }

  // Solo métodos de dominio esenciales
  canBeCancelled(): boolean {
    const validStatus = this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;

    // Diferencia entre la reserva y ahora en milisegundos
    const diffMs = this.timeStart.getTime() - Date.now();

    // Convertir a horas
    const diffHours = diffMs / 1000 / 60 / 60;

    // Se permite reprogramar si queda más de 1 hora para la reserva
    const isOnTime = diffHours > 1;

    return validStatus && isOnTime;
  }

  canBeRescheduled(): boolean {
    // Solo reservas activas pueden reprogramarse
    const validStatus = this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;

    // Diferencia entre la reserva y ahora en milisegundos
    const diffMs = this.timeStart.getTime() - Date.now();

    // Convertir a horas
    const diffHours = diffMs / 1000 / 60 / 60;

    // Se permite reprogramar si queda más de 1 hora para la reserva
    const isOnTime = diffHours > 1;
    return validStatus && isOnTime;
  }


  static createPending(
    customerId: number,
    serviceId: number,
    commerceId: number,
    userId: number,
    timeStart: Date,
    timeEnd: Date,
    duration: number,
    notes: string = '',
  ): Booking {
    return new Booking(
      0, // ID será asignado por la base de datos
      customerId,
      commerceId,
      duration,
      userId,
      BookingStatus.PENDING,
      serviceId,
      timeStart,
      timeEnd,
      notes,
    );
  }

}
