import { BookingStatus } from "@/domain/dbEnums/BookingStatus";

export class BookingHistory {
    constructor(
        public readonly id: number,
        public readonly bookingId: number,
        public readonly commerceId: number,
        public readonly customerId: number,
        public userId: number,
        public priceAtBooking: number,
        public durationAtBooking: number,
        public timeStart: Date,
        public timeEnd: Date,
        public status: BookingStatus,
        public notes: string,
    ) { }

    // Factory method
    static create(props: {
        bookingId: number,
        commerceId: number,
        customerId: number,
        userId: number,
        priceAtBooking: number,
        durationAtBooking: number,
        timeStart: Date,
        timeEnd: Date,
        status: BookingStatus,
        notes: string
    }): BookingHistory {
        return new BookingHistory(
            0,
            props.bookingId,
            props.commerceId,
            props.customerId,
            props.userId,
            props.priceAtBooking,
            props.durationAtBooking,
            props.timeStart,
            props.timeEnd,
            props.status,
            props.notes
        );
    }
}
