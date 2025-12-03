import { BookingDetail } from '../common/BookingDetail.type';
import { BookingMP } from '../common/BookingMP.type';
import { BookingUpdateData } from '../common/BookingUpdateData';
import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {

  createSchedule(data: Booking, idempotencyKey?: string): Promise<Booking | null>;

  findByIdempotencyKey(key: string): Promise<Booking | null>;

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
