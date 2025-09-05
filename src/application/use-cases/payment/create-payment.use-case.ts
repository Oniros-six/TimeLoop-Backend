import { BOOKING_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';
import { Payment as PaymentDomain } from '@/domain/entities/payment.entity';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { PaymentOrchestratorService } from '@/domain/services/payment/PaymentOrchestratorService';
import { PaymentSecurityValidator } from '@/domain/services/payment/PaymentSecurityValidator';
import { PaymentLogger } from '@/infrastructure/logging/PaymentLogger';
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

        private readonly paymentLogger: PaymentLogger,

        private readonly securityValidator: PaymentSecurityValidator,
    ) { }

    async execute(data: CreatePaymentDto, securityContext?: { ipAddress?: string; userAgent?: string; userId?: number }) {
        const startTime = Date.now();

        try {
            //* Confirmamos la existencia del booking
            const booking = await this.bookingRepository.findOne({
                id: data.bookingId
            });

            if (!booking) {
                this.paymentLogger.logError({
                    bookingId: data.bookingId,
                    message: 'Reserva no encontrada al crear pago',
                }, new Error('Booking not found'));

                return {
                    message: 'Reserva no encontrada',
                    statusCode: HttpStatus.NOT_FOUND,
                };
            }

            const previousPayment = await this.paymentRepository.findByBookingId(booking.id)
            const hasApproved = previousPayment.some(p => p.status === PaymentStatus.approved);

            if (hasApproved) {
                this.paymentLogger.logSecurityEvent({
                    bookingId: booking.id,
                    commerceId: booking.commerceId,
                    message: 'Intento de pago duplicado',
                }, 'DUPLICATE_PAYMENT_ATTEMPT');

                return {
                    message: 'Esta reserva ya fue paga',
                    statusCode: HttpStatus.CONFLICT,
                };
            }

            //* Validaciones de seguridad
            if (securityContext) {
                const securityContextData = {
                    commerceId: booking.commerceId,
                    userId: securityContext.userId,
                    amount: booking.totalPrice,
                    ipAddress: securityContext.ipAddress,
                    userAgent: securityContext.userAgent,
                    timestamp: new Date(),
                };

                const securityViolations = await this.securityValidator.validatePaymentSecurity(securityContextData);

                if (securityViolations.length > 0) {
                    const criticalViolations = securityViolations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH');

                    if (criticalViolations.length > 0) {
                        this.paymentLogger.logSecurityEvent({
                            bookingId: booking.id,
                            commerceId: booking.commerceId,
                            message: 'Violación de seguridad crítica detectada',
                            metadata: { violations: criticalViolations },
                        }, 'CRITICAL_SECURITY_VIOLATION');

                        throw new HttpException(
                            'Operación bloqueada por motivos de seguridad',
                            HttpStatus.FORBIDDEN
                        );
                    }

                    // Log de violaciones menores
                    securityViolations.forEach(violation => {
                        this.paymentLogger.logSecurityEvent({
                            bookingId: booking.id,
                            commerceId: booking.commerceId,
                            message: `Violación de seguridad: ${violation.type}`,
                            metadata: { violation },
                        }, violation.type);
                    });
                }
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

            const savedPayment = await this.paymentRepository.create(payment);

            if (!savedPayment) {
                this.paymentLogger.logError({
                    bookingId: booking.id,
                    commerceId: booking.commerceId,
                    message: 'Error al registrar el pago en BD',
                }, new Error('Payment creation failed'));

                return {
                    message: 'Error al registrar el pago',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                };
            }

            this.paymentLogger.logPaymentCreated({
                paymentId: savedPayment.id,
                bookingId: savedPayment.bookingId,
                commerceId: savedPayment.commerceId,
                amount: savedPayment.amount,
                currency: savedPayment.currency,
                provider: savedPayment.method,
                status: savedPayment.status,
            });

            //* Derivar al proveedor específico
            this.paymentLogger.logPaymentProcessing({
                paymentId: savedPayment.id,
                bookingId: savedPayment.bookingId,
                commerceId: savedPayment.commerceId,
                provider: savedPayment.method,
            });

            const paymentResult = await this.paymentOrchestrator.processPaymentWithProvider(savedPayment);

            if (paymentResult.providerRef) {
                await this.paymentRepository.update(savedPayment.id, {
                    externalPaymentId: paymentResult.providerRef,
                    status: paymentResult.status
                });
            }

            //* Log del cambio de estado
            const processingTime = Date.now() - startTime;
            this.paymentLogger.logPaymentStatusChange({
                paymentId: savedPayment.id,
                bookingId: savedPayment.bookingId,
                commerceId: savedPayment.commerceId,
                status: paymentResult.status,
                duration: processingTime,
            });

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
            const processingTime = Date.now() - startTime;
            const message = err instanceof Error ? err.message : 'Error desconocido';

            this.paymentLogger.logError({
                bookingId: data.bookingId,
                message: 'Error procesando pago',
                duration: processingTime,
                error: message,
            }, err as Error);

            // Registrar fallo en métricas si tenemos contexto
            if (securityContext?.userId) {
                this.securityValidator.recordFailure({
                    userId: securityContext.userId,
                    commerceId: data.bookingId, // Usar bookingId como fallback
                    timestamp: new Date(),
                });
            }

            throw new HttpException(
                'Algo salió mal al registrar el pago, inténtelo de nuevo más tarde.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
