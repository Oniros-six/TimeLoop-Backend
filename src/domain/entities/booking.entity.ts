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
    public totalPrice: number,
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

  static calcTotalPrice(services: Service[]): number {
    return services.reduce((total, service) => total + service.price, 0);
  }

  calcTotalPrice(services: Service[]): number {
    return services.reduce((total, service) => total + service.price, 0);
  }

  private isActiveAndOnTime(cancellationDeadlineMinutes: number): boolean {
    const validStatus =
      this.status === BookingStatus.CONFIRMED || this.status === BookingStatus.PENDING;
  
    const diffMinutes = (this.timeStart.getTime() - Date.now()) / 1000 / 60;
  
    return validStatus && diffMinutes > cancellationDeadlineMinutes;
  }
  

  canBeCanceled(cancellationDeadlineMinutes: number): boolean {
    return this.isActiveAndOnTime(cancellationDeadlineMinutes);
  }

  canBeRescheduled(cancellationDeadlineMinutes: number): boolean {
    return this.isActiveAndOnTime(cancellationDeadlineMinutes);
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
    const totalprice = this.calcTotalPrice(services)

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
      totalprice,
      newServices,
    );

    return booking;
  }

}