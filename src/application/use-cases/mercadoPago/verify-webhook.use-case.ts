import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { VerifyPayment } from '@/application/use-cases/mercadoPago/verify-payment.use-case';
import * as crypto from 'crypto';

export interface WebhookData {
    type: string;
    data: {
        id: string;
    };
}

@Injectable()
export class VerifyWebhook {
    constructor(
        private readonly verifyPaymentUseCase: VerifyPayment,
    ) {}

    async execute(body: any, headers: any): Promise<{ received: boolean; processed?: any }> {
        try {
            // 1. Validar que el webhook viene de MercadoPago
            if (!this.isValidSignature(body, headers)) {
                throw new HttpException(
                    'Webhook no autenticado - firma inválida',
                    HttpStatus.UNAUTHORIZED
                );
            }

            // 2. Procesar el webhook según el tipo
            const { type, data } = body as WebhookData;

            if (type === 'payment' && data?.id) {
                const paymentId = data.id;
                const result = await this.verifyPaymentUseCase.execute(paymentId);
                
                return {
                    received: true,
                    processed: result
                };
            }

            // Para otros tipos de webhook, solo confirmar recepción
            return { received: true };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            const message = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error procesando webhook:', message);
            throw new HttpException(
                'Error procesando webhook de MercadoPago',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Valida la firma del webhook según la documentación de MercadoPago
     */
    private isValidSignature(body: any, headers: any): boolean {
        try {
            // Obtener la firma del header
            const signature = headers['x-signature'];
            if (!signature) {
                console.warn('Webhook sin firma X-Signature');
                return false;
            }

            // Obtener el webhook secret de las variables de entorno
            const webhookSecret = process.env.MP_WEBHOOK_SECRET;
            if (!webhookSecret) {
                console.error('MP_WEBHOOK_SECRET no configurado');
                return false;
            }

            // Crear el payload para validar
            const payload = JSON.stringify(body);
            
            // Crear la firma esperada
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');

            // Comparar firmas de manera segura
            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );

            if (!isValid) {
                console.warn('Firma de webhook inválida', {
                    received: signature,
                    expected: expectedSignature
                });
            }

            return isValid;

        } catch (error) {
            console.error('Error validando firma de webhook:', error);
            return false;
        }
    }
}
