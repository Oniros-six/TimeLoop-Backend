import { BookingService } from '../entities/bookingService.entity';

export interface BookingUpdateData {
  timeStart?: Date;
  timeEnd?: Date;
  serviceIds: BookingService[];
  totalPrice: number;
  duration?: number;
  userId?: number;
  notes?: string;
}
