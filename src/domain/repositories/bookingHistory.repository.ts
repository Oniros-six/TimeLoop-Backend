import { BookingHistoryUpdateData } from '../common/BookingHistoryUpdateData';
import { BookingHistory } from '../entities/bookingHistory.entity';

export interface IBookingHistoryRepository {
  findByCommerce(data: {
    commerceId: number;
  }): Promise<BookingHistory[] | null>;

  findByUser(data: { userId: number }): Promise<BookingHistory[] | null>;

  findByDates(data: {
    startDate: Date;
    endDate: Date;
  }): Promise<BookingHistory[] | null>;

  findByDatesAndCommerce(data: {
    commerceId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<BookingHistory[] | null>;

  findByDatesAndUser(data: {
    userId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<BookingHistory[] | null>;

  update(data: {
    id: number;
    history: BookingHistoryUpdateData;
  }): Promise<BookingHistory | null>;

  create(data: BookingHistory): Promise<BookingHistory | null>;
}
