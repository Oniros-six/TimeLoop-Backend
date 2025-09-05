import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';

export interface PaymentLogContext {
    paymentId?: number;
    bookingId?: number;
    commerceId?: number;
    userId?: number;
    amount?: number;
    currency?: string;
    provider?: string;
    status?: PaymentStatus;
    error?: string;
    duration?: number;
    message?: string;
    event?: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class PaymentLogger {
    private readonly logger = new Logger('PaymentModule');

    /**
     * Log de creación de pago
     */
    logPaymentCreated(context: PaymentLogContext) {
        this.logger.log({
            event: 'PAYMENT_CREATED',
            message: 'Nuevo pago creado exitosamente',
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de procesamiento de pago
     */
    logPaymentProcessing(context: PaymentLogContext) {
        this.logger.log({
            event: 'PAYMENT_PROCESSING',
            message: 'Procesando pago con proveedor',
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de cambio de estado
     */
    logPaymentStatusChange(context: PaymentLogContext) {
        this.logger.log({
            event: 'PAYMENT_STATUS_CHANGED',
            message: `Estado de pago cambiado a ${context.status}`,
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de reembolso
     */
    logRefundProcessed(context: PaymentLogContext) {
        this.logger.log({
            event: 'REFUND_PROCESSED',
            message: 'Reembolso procesado exitosamente',
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de webhook recibido
     */
    logWebhookReceived(context: PaymentLogContext) {
        this.logger.log({
            event: 'WEBHOOK_RECEIVED',
            message: 'Webhook de MercadoPago recibido',
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de error crítico
     */
    logError(context: PaymentLogContext, error: Error) {
        this.logger.error({
            event: 'PAYMENT_ERROR',
            message: 'Error en módulo de pagos',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de métricas de rendimiento
     */
    logPerformance(context: PaymentLogContext) {
        this.logger.log({
            event: 'PAYMENT_PERFORMANCE',
            message: 'Métricas de rendimiento',
            ...context,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log de seguridad
     */
    logSecurityEvent(context: PaymentLogContext, event: string) {
        this.logger.warn({
            event: 'SECURITY_EVENT',
            message: `Evento de seguridad: ${event}`,
            ...context,
            timestamp: new Date().toISOString(),
        });
    }
}
