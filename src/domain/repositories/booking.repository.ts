import { BookingDetail } from '../common/BookingDetail.type';
import { BookingUpdateData } from '../common/BookingUpdateData';
import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  //* Create repository methods
  findBusy(data: {
    timeStart: Date;
    commerceId: number;
  }): Promise<Booking | null>;

  createSchedule(data: Booking): Promise<Booking | null>;

  findOverlapping(data: {
    id?: number;
    userId: number;
    timeStart: Date;
    timeEnd: Date;
  }): Promise<Booking | null>;

  //* FindAllByCommerce repository methods
  findAllByCommerce(data: { commerceId: number }): Promise<Booking[] | null>;

  findAllByUser(data: { userId: number }): Promise<Booking[] | null>;

  //* findBusySlots repository methods
  findBusySlots(data: {
    userId: number;
    timeStart: Date;
  }): Promise<Booking[] | null>;

  //* findAllByDateAndCommerce repository methods
  findAllByDateAndCommerce(data: {
    commerceId: number;
    timeStart: Date;
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

  findBookingData(bookingId: number): Promise<BookingDetail>;
}
