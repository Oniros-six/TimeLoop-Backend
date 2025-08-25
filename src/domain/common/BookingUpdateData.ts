import { BookingStatus } from '@/domain/dbEnums/BookingStatus';

export interface BookingUpdateData {
  date?: Date;
  timeEnd?: Date;
  serviceId?: number;
  notes?: string;
  status?: BookingStatus;
}
