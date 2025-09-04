import { PaymentMethod } from '@/domain/dbEnums/paymentMethods';
import { IPaymentProvider } from '@/domain/services/payment/IPaymentProvider';
import { PaymentOrchestratorService } from '@/domain/services/payment/PaymentOrchestratorService';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payment.controller';

// Use cases
import { CreatePayment } from '@/application/use-cases/payment/create-payment.use-case';
import { GetPaymentsByBooking } from '@/application/use-cases/payment/get-payments-by-booking.use-case';

// Tokens
import {
    BOOKING_REPOSITORY,
    MERCADO_PAGO_REPOSITORY,
    PAYMENT_PROVIDERS,
    PAYMENT_REPOSITORY
} from '@/application/providers';

// Services

// Providers
import { CashProvider } from '@/domain/services/payment/providers/CashProvider';
import { MercadoPagoProvider } from '@/domain/services/payment/providers/MercadoPagoProvider';

// Repositories
import { PrismaBookingRepository } from '@/infrastructure/prisma/repositories/booking.repository';
import { PrismaPaymentRepository } from '@/infrastructure/prisma/repositories/payment.repository';
import { ProcessRefunds } from '@/application/use-cases/payment/process-refunds.use-case';
import { PrismaMercadoPagoRepository } from '@/infrastructure/prisma/repositories/mercadoPago.repository';

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
        {
            provide: MERCADO_PAGO_REPOSITORY,
            useClass: PrismaMercadoPagoRepository,
        },
        {
            provide: PAYMENT_PROVIDERS,
            useFactory: (mercadoPagoRepo, bookingRepo, paymentRepo, activityLog) => {
                const providers = new Map<PaymentMethod, IPaymentProvider>();
                providers.set(PaymentMethod.MERCADO_PAGO, new MercadoPagoProvider(
                    mercadoPagoRepo, bookingRepo, paymentRepo, activityLog
                ));
                providers.set(PaymentMethod.CASH, new CashProvider());
                return providers;
            },
            inject: [MERCADO_PAGO_REPOSITORY, BOOKING_REPOSITORY, PAYMENT_REPOSITORY]
        },

        PaymentOrchestratorService,
        CreatePayment,
        GetPaymentsByBooking,
        ProcessRefunds
    ],
})
export class PaymentModule { }
