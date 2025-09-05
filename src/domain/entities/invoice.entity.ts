import { InvoiceStatus } from "../dbEnums/InvoiceStatus.enum";

export class Invoice {
    constructor(
        public readonly id: number,
        public readonly commerceId: number,
        public periodStart: Date,
        public periodEnd: Date,
        public totalBookings: number,
        public totalCanceled: number,
        public totalIncome: number,
        public feePercentage: number,
        public serviceFee: number,
        public generatedAt: Date,
        public status: InvoiceStatus,
    ) { }

    // Factory method
    static create(props: {
        commerceId: number,
        periodStart: Date,
        periodEnd: Date,
        totalBookings: number,
        totalCanceled: number,
        totalIncome: number,
        feePercentage: number,
        serviceFee: number,
    }): Invoice {
        return new Invoice(
            0,
            props.commerceId,
            props.periodStart,
            props.periodEnd,
            props.totalBookings,
            props.totalCanceled,
            props.totalIncome,
            props.feePercentage,
            props.serviceFee,
            new Date(),
            InvoiceStatus.PENDING,
        );
    }
}