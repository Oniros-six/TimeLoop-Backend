import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { PaymentsController } from './payment.controller';

// Use cases
import { CreatePayment } from '@/application/use-cases/payment/create-payment.use-case'
import { GetPaymentsByBooking } from '@/application/use-cases/payment/get-payments-by-booking.use-case'
import { ConfirmPaymentStatus } from '@/application/use-cases/payment/confirm-payment-status.use-case'

// Tokens
import {
    PAYMENT_REPOSITORY,
    BOOKING_REPOSITORY
} from '@/application/providers';

// Repositories
import { PrismaPaymentRepository } from '@/infrastructure/prisma/repositories/payment.repository';
import { PrismaBookingRepository } from '@/infrastructure/prisma/repositories/booking.repository';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentsController],
    providers: [
        {
            provide: PAYMENT_REPOSITORY,
            useClass: PrismaPaymentRepository,
        },
        {
            provide: BOOKING_REPOSITORY,
            useClass: PrismaBookingRepository,
        },
        
        CreatePayment,
        GetPaymentsByBooking,
        ConfirmPaymentStatus
    ],
})
export class PaymentModule { }
