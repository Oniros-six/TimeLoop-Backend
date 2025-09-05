// src/application/use-cases/payment/process-refunds.use-case.ts
import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '@/application/providers';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { PaymentStateMachine } from '@/domain/value-objects/payment/PaymentStateMachine';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { PaymentOrchestratorService } from '@/domain/services/payment/PaymentOrchestratorService';

@Injectable()
export class ProcessRefunds {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
        
        private readonly paymentOrchestrator: PaymentOrchestratorService,
        private readonly activityLogService: ActivityLogService,
    ) {}

    async execute(paymentId: number) {
        try {
            // 1. Validar que el pago existe
            const payment = await this.paymentRepository.findById(paymentId);
            if (!payment) {
                throw new HttpException('Pago no encontrado', HttpStatus.NOT_FOUND);
            }

            // 2. Validar que el pago está aprobado
            if (payment.status !== PaymentStatus.approved) {
                throw new HttpException(
                    'Solo se pueden reembolsar pagos aprobados', 
                    HttpStatus.BAD_REQUEST
                );
            }

            // 3. Obtener el monto del reembolso desde la base de datos
            const refundAmount = payment.amount;

            // 4. Validar monto del reembolso
            if (refundAmount <= 0) {
                throw new HttpException(
                    'El monto del pago debe ser mayor a 0', 
                    HttpStatus.BAD_REQUEST
                );
            }

            // 5. Validar transición de estado
            PaymentStateMachine.validateTransition(payment.status, PaymentStatus.refunded);

            // 6. Procesar reembolso con el proveedor
            const refundResult = await this.paymentOrchestrator.processRefundWithProvider(
                payment, 
                refundAmount
            );

            // 7. Actualizar estado del pago
            const updatedPayment = await this.paymentRepository.updateStatus(
                payment.id,
                PaymentStatus.refunded
            );

            // 8. Registrar en activity log
            await this.activityLogService.updated({
                entityType: EntityType.PAYMENT,
                entityId: payment.id,
                detail: `Reembolso procesado: ${refundAmount} - ID MP: ${refundResult.id}`,
            });

            return {
                message: 'Reembolso procesado exitosamente',
                statusCode: HttpStatus.OK,
                data: {
                    payment: updatedPayment,
                    refundAmount: refundAmount,
                    refundResult: refundResult
                }
            };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            
            const message = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error procesando reembolso:', message);
            throw new HttpException(
                'Error procesando reembolso, inténtelo más tarde',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}