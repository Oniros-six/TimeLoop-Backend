import { BookingUpdateData } from '../common/BookingUpdateData';
import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  //* Create repository methods

  findBusy(data: {
    date: Date;
    timeStart: Date;
    commerceId: number;
  }): Promise<Booking | null>;

  createSchedule(data: {
    customerId: number;
    serviceId: number;
    commerceId: number;
    date: Date;
    timeStart: Date;
    duration: number;
    notes: string | undefined;
  }): Promise<Booking | null>;

  findOverlapping(data: {
    startTime: Date;
    endTime: Date;
    date: Date;
    commerceId: number;
  }): Promise<Booking[] | null>;

  //* FindAllByCommerce repository methods
  findAllByCommerce(data: { commerceId: number }): Promise<Booking[] | null>;

  //* findBusySlots repository methods
  findBusySlots(data: {
    commerceId: number;
    date: string;
  }): Promise<Booking[] | null>;

  //* findAllByDateAndCommerce repository methods
  findAllByDateAndCommerce(data: {
    commerceId: number;
    date: string;
  }): Promise<Booking[] | null>;

  //* Cancel a schedule
  cancelSchedule(data: { id: number }): Promise<Booking | null>;

  //* Update schedule
  updateSchedule(data: {
    id: number;
    dataToUpdate: BookingUpdateData;
  }): Promise<Booking | null>;

  //* General use
  findOne(data: { id: number }): Promise<Booking | null>;
}
