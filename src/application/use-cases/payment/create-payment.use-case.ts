import { BOOKING_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus';
import { Payment as PaymentDomain } from '@/domain/entities/payment.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { PaymentOrchestratorService } from '@/domain/services/payment/PaymentOrchestratorService';
import { CreatePaymentDto } from '@/interfaces/controllers/payment/dto/create-payment.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreatePayment {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,

        @Inject(BOOKING_REPOSITORY)
        private readonly bookingRepository: IBookingRepository,

        private readonly paymentOrchestrator: PaymentOrchestratorService,

        private readonly activityLogService: ActivityLogService,
    ) { }

    async execute(data: CreatePaymentDto) {
        //* Confirmamos la existenccia del booking
        const booking = await this.bookingRepository.findOne({
            id: data.bookingId
        });

        if (!booking) {
            return {
                message: 'Reserva no encontrada',
                statusCode: HttpStatus.NOT_FOUND,
            };
        }

        const previousPayment = await this.paymentRepository.findByBookingId(booking.id)
        const hasApproved = previousPayment.some(p => p.status === PaymentStatus.approved);

        if (hasApproved) {
            return {
                message: 'Esta reserva ya fue paga',
                statusCode: HttpStatus.CONFLICT,
            };
        }

        const payment = PaymentDomain.create({
            bookingId: booking.id,
            commerceId: booking.commerceId,
            amount: booking.totalPrice,
            currency: data.currency,
            status: PaymentStatus.pending,
            method: data.paymentProvider,
            createdAt: new Date(),
            updatedAt: null,
            providerRef: null,
            refundedAt: null
        });

        try {
            const savedPayment = await this.paymentRepository.create(payment);

            if (!savedPayment) {
                return {
                    message: 'Error al registrar el pago',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                };
            }

            //* Derivar al proveedor específico
            const paymentResult = await this.paymentOrchestrator.processPaymentWithProvider(savedPayment);

            if (paymentResult.providerRef) {
                await this.paymentRepository.update(savedPayment.id, {
                    externalPaymentId: paymentResult.providerRef,
                    status: paymentResult.status
                });
            }

            await this.activityLogService.created({
                entityType: EntityType.PAYMENT,
                entityId: savedPayment.id,
                userId: null,
                commerceId: null,
                customerId: null,
                detail: `Se creo el pago para la reserva: ${savedPayment.bookingId}`,
            });

            return {
                message: 'Pago procesado exitosamente',
                data: { payment: savedPayment, paymentResult }
            };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            console.error(message);
            throw new HttpException(
                'Algo salió mal al registrar el pago, inténtelo de nuevo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
