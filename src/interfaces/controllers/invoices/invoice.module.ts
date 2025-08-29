import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { InvoiceController } from './invoice.controller';

// Use cases
import { CreateInvoice } from '@/application/use-cases/invoice/create-invoice.use-case';
import { FindAllByCommerce } from '@/application/use-cases/invoice/find-all-commerce.use-case';
import { FindAllByCommerceDate } from '@/application/use-cases/invoice/find-all-date-commerce.use-case';
import { UpdateSent } from '@/application/use-cases/invoice/update-sent.use-case';
import { UpdatePaid } from '@/application/use-cases/invoice/update-paid.use-case';

// Cron
import { InvoiceCron } from '@/domain/services/invoices/generate-invoice.job';

// Tokens
import {
    COMMERCE_REPOSITORY,
    INVOICE_REPOSITORY,
    BOOKING_HISTORY_REPOSITORY
} from '@/application/providers';

// Repositories
import { PrismaCommerceRepository } from '@/infrastructure/prisma/repositories/commerce.repository';
import { PrismaInvoiceRepository } from '@/infrastructure/prisma/repositories/invoice.repository';
import { PrismaBookingHistoryRepository } from '@/infrastructure/prisma/repositories/bookingHistory.repository';

@Module({
    imports: [PrismaModule],
    controllers: [InvoiceController],
    providers: [
        {
            provide: INVOICE_REPOSITORY,
            useClass: PrismaInvoiceRepository,
        },
        {
            provide: COMMERCE_REPOSITORY,
            useClass: PrismaCommerceRepository,
        },
        {
            provide: BOOKING_HISTORY_REPOSITORY,
            useClass: PrismaBookingHistoryRepository,
        },
        CreateInvoice,
        FindAllByCommerce,
        FindAllByCommerceDate,
        UpdateSent,
        UpdatePaid,

        // cron
        InvoiceCron,
    ],
})
export class InvoiceModule { }
