import { BookingDetail } from '../common/BookingDetail.type';
import { BookingMP } from '../common/BookingMP.type';
import { BookingUpdateData } from '../common/BookingUpdateData';
import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  //* Create repository methods
  findBusy(data: {
    timeStart: Date;
    userId: number;
  }): Promise<Booking | null>;

  createSchedule(data: Booking): Promise<Booking | null>;

  findOverlapping(data: {
    id?: number;
    userId: number;
    timeStart: Date;
    timeEnd: Date;
  }): Promise<Booking | null>;

  //* FindAllByCommerce repository methods
  findAllByCommerce(data: { commerceId: number, limit?: number, cursor?: number }): Promise<{
    items: BookingDetail[];
    nextCursor: number | null;
    hasNextPage: boolean;
  }>;

  findAllByUser(data: { userId: number, limit?: number, cursor?: number }): Promise<{
    items: BookingDetail[];
    nextCursor: number | null;
    hasNextPage: boolean;
  }>;

  //* findBusySlots repository methods
  findBusySlots(data: {
    userId: number;
    timeStart: Date;
  }): Promise<Booking[] | null>;

  //* findAllByDateAndUser repository methods
  findAllByDateAndUser(data: {
    userId: number;
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

  findBookingData(bookingId: number): Promise<BookingMP>;
}
