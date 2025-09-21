export interface DashboardData {
  commerceId: number;
  commerceName: string;
  history: HistoryItem[];
}

export interface HistoryItem {
  id: number;
  bookingId: number;
  customerId: number;
  priceAtBooking: number;
  timeStart: Date;
  booking: Booking;
  customer: Customer;
}

export interface Booking {
  bookingServices: BookingService[];
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
