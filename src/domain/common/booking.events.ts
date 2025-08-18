import { Booking } from '../entities/booking.entity';

// booking.events.ts
export class BookingCreatedEvent {
  constructor(public readonly booking: Booking) {}
}

export class BookingCancelledEvent {
  constructor(public readonly booking: Booking) {}
}

export class BookingRescheduledEvent {
  constructor(
    public readonly booking: Booking,
    public readonly newDate: Date,
  ) {}
}
