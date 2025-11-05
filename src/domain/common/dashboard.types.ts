import { BookingStatus } from "@/domain/dbEnums/BookingStatus.enum";

export interface DashboardData {
  commerceId: number;
  commerceName: string;
  logoUrl: string;
  history: HistoryItem[];
  recentActivity: RecentItem[];
}

export interface HistoryItem {
  id: number;
  bookingId: number;
  customerId: number;
  user: { name: string };
  priceAtBooking: number;
  timeStart: Date;
  booking: {
    bookingServices: BookingService[];
  };
  customer: Customer;
}

export interface RecentItem {
  id: number;
  customerId: number;
  user: { name: string };
  timeStart: Date;
  status: BookingStatus;
  bookingServices: BookingService[];
  customer: Customer;
}


export interface BookingService {
  service: Service;
}

export interface Service {
  name: string;
}

export interface Customer {
  name: string;
}
