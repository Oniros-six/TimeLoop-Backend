import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MercadoPagoController } from './mercadoPago.controller';
import { HttpModule } from '@nestjs/axios';

// Use cases
import { CreateOrRefresh } from '@/application/use-cases/mercadoPago/create-or-refresh.use-case';
import { VerifyPayment } from '@/application/use-cases/mercadoPago/verify-payment.use-case';
import { VerifyWebhook } from '@/application/use-cases/mercadoPago/verify-webhook.use-case';

// Tokens
import {
  MERCADO_PAGO_REPOSITORY,
  PAYMENT_REPOSITORY,
  BOOKING_REPOSITORY,
} from '@/application/providers';

// Services
import { MercadoPagoService } from '@/domain/services/mercadoPago/mercadoPago.service';
import { TokenEncryptionService } from '@/infrastructure/payments/TokenEncryptationService';

// Repositories
import { PrismaMercadoPagoRepository } from '@/infrastructure/prisma/repositories/mercadoPago.repository';
import { PrismaPaymentRepository } from '@/infrastructure/prisma/repositories/payment.repository';
import { PrismaBookingRepository } from '@/infrastructure/prisma/repositories/booking.repository';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MercadoPagoController],
  providers: [
    {
      provide: MERCADO_PAGO_REPOSITORY,
      useClass: PrismaMercadoPagoRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
    TokenEncryptionService,
    MercadoPagoService,
    CreateOrRefresh,
    VerifyPayment,
    VerifyWebhook,
  ],
})
export class MercadoPagoModule {}
