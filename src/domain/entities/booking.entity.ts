import { BookingStatus } from "@/domain/dbEnums/BookingStatus"
import { BookingService } from "./bookingService.entity";
import { Service } from "./service.entity";
import { addMinutesToTime } from "../value-objects/booking/validations";

export class Booking {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly commerceId: number,
    public duration: number,
    public userId: number,
    public status: BookingStatus,
    public timeStart: Date,
    public timeEnd: Date,
    public notes: string,
    public bookingServices: BookingService[],
  ) { }

  updateServices(serviceIds: number[]) {
    this.bookingServices = serviceIds.map(id => new BookingService(this.id, id));
  }

  static calcServicesDuration(services: Service[]): number {
    return services.reduce((total, service) => total + service.durationMinutes, 0);
  }

  calcServicesDuration(services: Service[]): number {
    return services.reduce((total, service) => total + service.durationMinutes, 0);
  }

  private isActiveAndOnTime(): boolean {
    const validStatus = this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;
    const diffHours = (this.timeStart.getTime() - Date.now()) / 1000 / 60 / 60;
    return validStatus && diffHours > 1;
  }

  canBeCancelled(): boolean {
    return this.isActiveAndOnTime();
  }

  canBeRescheduled(): boolean {
    return this.isActiveAndOnTime();
  }

  static createPending(
    customerId: number,
    commerceId: number,
    userId: number,
    timeStart: Date,
    notes: string = '',
    services: Service[],
  ): Booking {
    // Creamos la relación con los servicios
    const newServices = services.map(service => new BookingService(0, service.id));
    const totalDuration = this.calcServicesDuration(services)
    const timeEnd = addMinutesToTime(timeStart, totalDuration);

    const booking = new Booking(
      0, // ID será asignado por la DB
      customerId,
      commerceId,
      totalDuration,
      userId,
      BookingStatus.PENDING,
      timeStart,
      timeEnd,
      notes,
      newServices,
    );

    return booking;
  }

}