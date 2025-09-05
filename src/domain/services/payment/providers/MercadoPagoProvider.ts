import { Payment } from '@/domain/entities/payment.entity';
import { IPaymentProvider, PaymentResult } from '../IPaymentProvider';
import { Injectable, Inject } from '@nestjs/common';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';
import { RefundResponse } from 'mercadopago/dist/clients/paymentRefund/commonTypes';
import { MercadoPagoConfig, PaymentRefund, Preference } from 'mercadopago';
import {
  MERCADO_PAGO_REPOSITORY,
  BOOKING_REPOSITORY,
} from '@/application/providers';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { TokenValidationService } from '@/domain/services/mercadoPago/TokenValidationService';

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  constructor(
    @Inject(MERCADO_PAGO_REPOSITORY)
    private readonly mercadoPagoRepository: IMercadoPagoRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  async processPayment(payment: Payment): Promise<PaymentResult> {
    try {
      // 1. Validar y refrescar token si es necesario
      const accessToken =
        await this.tokenValidationService.validateAndRefreshToken(
          payment.commerceId,
        );

      // 2. Obtener datos del booking
      const bookingData = await this.bookingRepository.findBookingData(
        payment.bookingId,
      );

      // 3. Crear cliente de MercadoPago
      const client = new MercadoPagoConfig({
        accessToken: accessToken,
      });

      const preference = new Preference(client);

      // 4. Crear preferencia de pago
      const preferenceResult = await preference.create({
        body: {
          items: [
            {
              id: payment.bookingId.toString(),
              title: `Reserva en ${bookingData.commerce.name}`,
              quantity: 1,
              unit_price: payment.amount,
              currency_id: payment.currency,
            },
          ],
          payer: {
            name: bookingData.customer.name,
            email: bookingData.customer.email,
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL}/payment/success`,
            failure: `${process.env.FRONTEND_URL}/payment/failure`,
            pending: `${process.env.FRONTEND_URL}/payment/pending`,
          },
          auto_return: 'approved',
          external_reference: payment.bookingId.toString(),
          payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }],
            installments: 1,
          },
        },
      });

      // 5. Retornar resultado
      return {
        success: true,
        status: PaymentStatus.pending,
        providerRef: preferenceResult.id,
        redirectUrl: preferenceResult.init_point,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.rejected,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async processRefund(
    paymentProviderRef: string,
    refundAmount: number,
    commerceId: number,
  ): Promise<RefundResponse> {
    try {
      // 1. Obtener credenciales del comercio
      const credentials =
        await this.mercadoPagoRepository.findByCommerceId(commerceId);
      if (!credentials) {
        throw new Error(
          `El comercio ${commerceId} no tiene credenciales de MercadoPago`,
        );
      }

      // 2. Crear cliente de MercadoPago
      const client = new MercadoPagoConfig({
        accessToken: credentials.accessToken,
      });

      const paymentRefund = new PaymentRefund(client);

      // 3. Procesar reembolso en MercadoPago
      const refundResult = await paymentRefund.create({
        payment_id: paymentProviderRef,
        body: {
          amount: refundAmount,
        },
      });

      return refundResult;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error procesando reembolso en MercadoPago: ${message}`);
    }
  }
}
