import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';

export class AvailabilityUpdateEventDto {
  bookingId: number;
  status: BookingStatus;
  timeStart: Date;
  timeEnd: Date;
  employeeId: number;
  commerceId: number;

  constructor(partial: Partial<AvailabilityUpdateEventDto>) {
    Object.assign(this, partial);
  }
}
