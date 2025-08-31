import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { Payment as DomainClient } from '@/domain/entities/payment.entity';
import { Currency } from "@/domain/dbEnums/Currency";
import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus";
import { PaymentMethod } from "@/domain/dbEnums/paymentMethods";

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
    constructor(private readonly prisma: PrismaService) { }

    private toDomain(invoice: {
        id: number;
        bookingId: number;
        commerceId: number;
        amount: number;
        currency: Currency;
        status: PaymentStatus;
        method: PaymentMethod;
        createdAt: Date;
        updatedAt: Date;
        providerRef: string | null;
        refundedAt: Date | null;
    }): DomainClient {
        return new DomainClient(
            invoice.id,
            invoice.bookingId,
            invoice.commerceId,
            invoice.amount,
            invoice.currency,
            invoice.status,
            invoice.method,
            invoice.createdAt,
            invoice.updatedAt,
            invoice.providerRef,
            invoice.refundedAt
        );
    }

    async create(payment: DomainClient): Promise<DomainClient> {
        const pay = await this.prisma.payment.create({
            data: {
                bookingId: payment.bookingId,
                commerceId: payment.commerceId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                providerRef: payment.providerRef,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
                refundedAt: payment.refundedAt
            },
        });
        return this.toDomain(pay)
    }

    async findById(id: number): Promise<DomainClient | null> {
        return this.prisma.payment.findUnique({ where: { id } });
    }

    async findByBookingId(bookingId: number): Promise<DomainClient[]> {
        return this.prisma.payment.findMany({ where: { bookingId } });
    }

    async updateStatus(id: number, status: PaymentStatus): Promise<DomainClient> {
        return this.prisma.payment.update({ where: { id }, data: { status } });
    }
}
