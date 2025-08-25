import { BookingStatus } from '@/domain/dbEnums/BookingStatus';

export interface BookingUpdateData {
  timeStart?: Date;
  timeEnd?: Date;
  serviceId?: number;
  userId?: number;
  notes?: string;
  status?: BookingStatus;
}
