import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IInvoiceRepository } from '@/domain/repositories/invoice.repository';
import { Invoice as DomainClient } from '@/domain/entities/invoice.entity';
import { InvoiceStatus } from '@/domain/dbEnums/InvoiceStatus.enum';

@Injectable()
export class PrismaInvoiceRepository implements IInvoiceRepository {
    constructor(private readonly prisma: PrismaService) { }

    private toDomain(invoice: {
        id: number,
        commerceId: number,
        periodStart: Date,
        periodEnd: Date,
        totalBookings: number,
        totalCanceled: number,
        totalIncome: number,
        feePercentage: number,
        serviceFee: number,
        generatedAt: Date,
        status: InvoiceStatus,
    }): DomainClient {
        return new DomainClient(
            invoice.id,
            invoice.commerceId,
            invoice.periodStart,
            invoice.periodEnd,
            invoice.totalBookings,
            invoice.totalCanceled,
            invoice.totalIncome,
            invoice.feePercentage,
            invoice.serviceFee,
            invoice.generatedAt,
            invoice.status
        );
    }

    async createInvoice(data: DomainClient): Promise<DomainClient> {
        const result = await this.prisma.invoice.create({
            data: {
                commerceId: data.commerceId,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                totalBookings: data.totalBookings,
                totalCanceled: data.totalCanceled,
                totalIncome: data.totalIncome,
                feePercentage: data.feePercentage,
                serviceFee: data.serviceFee,
                generatedAt: data.generatedAt,
                status: data.status,
            },
        });
    
        return this.toDomain(result);
    }
    
    async findAllByCommerce(commerceId: number): Promise<DomainClient[] | null> {
        const result = await this.prisma.invoice.findMany({
            where: { commerceId: commerceId }
        });

        if (!result) return null;
        return result.map((invoice) => this.toDomain(invoice));
    }
    
    async findById(invoiceId: number): Promise<DomainClient | null> {
        const result = await this.prisma.invoice.findFirst({
            where: { id: invoiceId }
        });

        if (!result) return null;
        return this.toDomain(result);
    }

    async findAllByCommerceDate(data: { commerceId: number, startPeriod: Date, endPeriod: Date }): Promise<DomainClient[] | null> {
        const result = await this.prisma.invoice.findMany({
            where: {
                commerceId: data.commerceId,
                AND: [
                    { periodStart: { lte: data.endPeriod } },
                    { periodEnd: { gte: data.startPeriod } },
                ]
            }
        });

        if (!result) return null;
        return result.map((invoice) => this.toDomain(invoice));
    }

    async updateStatus(data: { invoiceId: number, status: InvoiceStatus }): Promise<DomainClient | null> {
        const result = await this.prisma.invoice.update({
            where: {
                id: data.invoiceId
            },
            data: {
                status: data.status
            }
        });

        if (!result) return null;
        return this.toDomain(result);
    }
}
