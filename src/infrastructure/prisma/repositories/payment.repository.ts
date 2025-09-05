import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { Payment as DomainClient } from '@/domain/entities/payment.entity';
import { Currency } from "@/domain/dbEnums/Currency.enum";
import { PaymentStatus } from "@/domain/dbEnums/PaymentStatus.enum";
import { PaymentMethod } from "@/domain/dbEnums/PaymentMethods.enum";

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
        updatedAt: Date | null;
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
        const pay = await this.prisma.payment.findUnique({ where: { id } });

        if (!pay) return null;
        return this.toDomain(pay)
    }

    async findByProviderRef(ref: string): Promise<DomainClient> {
        const pay = await this.prisma.payment.findFirstOrThrow({
            where: { providerRef: ref },
          });
          
          return this.toDomain(pay)
    }


    async findByBookingId(bookingId: number): Promise<DomainClient[]> {
        const pay = await this.prisma.payment.findMany({ where: { bookingId } });

        return pay.map((p) => this.toDomain(p));
    }

    async updateStatus(id: number, status: PaymentStatus): Promise<DomainClient> {
        const pay = await this.prisma.payment.update({ where: { id }, data: { status } });

        return this.toDomain(pay)
    }

    async update(id: number, { externalPaymentId, status }: { externalPaymentId: string | undefined; status: PaymentStatus; }): Promise<DomainClient> {
        const pay = await this.prisma.payment.update({
            where: { id },
            data: {
                providerRef: externalPaymentId,
                status: status
            }
        });

        return this.toDomain(pay)
    }
}
