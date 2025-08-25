import { BookingStatus } from '@/domain/common/BookingStatus';

export interface BookingUpdateData {
  date?: Date;
  timeEnd?: Date;
  serviceId?: number;
  notes?: string;
  status?: BookingStatus;
}
