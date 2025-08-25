import { BookingUpdateData } from '../common/BookingUpdateData';
import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  //* Create repository methods
  findBusy(data: {
    date: Date;
    commerceId: number;
  }): Promise<Booking | null>;

  createSchedule(data: Booking): Promise<Booking | null>;

  findOverlapping(data: {
    id?: number;
    commerceId: number;
    date: Date;
    endTime: Date;
  }): Promise<Booking | null>;

  //* FindAllByCommerce repository methods
  findAllByCommerce(data: { commerceId: number }): Promise<Booking[] | null>;

  //* findBusySlots repository methods
  findBusySlots(data: {
    commerceId: number;
    date: Date;
  }): Promise<Booking[] | null>;

  //* findAllByDateAndCommerce repository methods
  findAllByDateAndCommerce(data: {
    commerceId: number;
    date: Date;
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
