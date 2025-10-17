import { Booking } from '../entities/booking.entity';

export type BookingDetail = Booking & {
  customer: { 
    name: string;
  };
  user: { 
    name: string;
  };
  services: {
    id: number;
    name: string;
  }[];
};
