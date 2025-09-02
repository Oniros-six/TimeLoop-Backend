import { BOOKING_REPOSITORY, MERCADO_PAGO_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { Payment } from '@/domain/entities/payment.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus'

@Injectable()
export class ProcessPayment {
    constructor(
        @Inject(MERCADO_PAGO_REPOSITORY)
        private readonly mercadoPagoRepository: IMercadoPagoRepository,

        @Inject(BOOKING_REPOSITORY)
        private readonly bookingRepository: IBookingRepository,

        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(payment: Payment) {
        try {
            const credentials = await this.mercadoPagoRepository.findByCommerceId(payment.commerceId)

            const bookingData = await this.bookingRepository.findBookingData(payment.bookingId)

            //TODO Aca usaria el accesstoken del comercio
            const client = new MercadoPagoConfig({ accessToken: `${process.env.MP_ACCESS_TOKEN}` });

            const preference = new Preference(client);

            //* Construir la solicitud a MercadoPago
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
                    auto_return: 'approved', // redirige automáticamente cuando el pago se aprueba
                    external_reference: payment.bookingId.toString(), // tu referencia interna
                    payment_methods: {
                        excluded_payment_types: [
                            { id: 'ticket' }, // ejemplo: excluye pagos tipo “ticket” (como pagos en efectivo en puntos de pago)
                        ],
                        installments: 1, // limita la cantidad de cuotas a 1
                    },
                }
            });

            //* Actualizar tu entidad Payment
            await this.paymentRepository.update(payment.id, {
                externalPaymentId: preferenceResult.id,
                status: PaymentStatus.pending,
                // initPoint: preferenceResult.init_point,
            });

            //* Devolver información al frontend
            return {
                init_point: preferenceResult.init_point, // checkout real
                sandbox_init_point: preferenceResult.sandbox_init_point, // si probás en sandbox
                id: preferenceResult.id,
            };

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            console.error('CreateOrRefresh MercadoPago:', message);
            throw new HttpException(
                'No se pudo conectar con MercadoPago, inténtelo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}