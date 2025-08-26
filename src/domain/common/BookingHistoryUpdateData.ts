export interface BookingHistoryUpdateData {
  timeStart?: Date;
  timeEnd?: Date;
  priceAtBooking: number;
  durationAtBooking?: number;
  userId?: number;
  notes?: string;
}
