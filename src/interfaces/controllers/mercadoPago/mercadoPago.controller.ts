import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrRefresh } from '@/application/use-cases/mercadoPago/create-or-refresh.use-case'
import { VerifyPayment } from '@/application/use-cases/mercadoPago/verify-payment.use-case'

@ApiTags('Mercado pago')
@Controller('mercadopago')
export class MercadoPagoController {
    constructor(
        private readonly createOrRefreshUseCase: CreateOrRefresh,
        private readonly verifyPaymentUseCase: VerifyPayment
    ) { }

    @ApiOperation({ summary: 'Callback de OAuth de MercadoPago' })
    @Get('/oauth/callback')
    async mercadopagoCallback(
        @Query('code') code: string,
        @Req() req: Request & { user?: { commerceId: number } }
    ) {
        if (!req.user || !req.user.commerceId) {
            throw new HttpException(
                'Usuario no autenticado o sin comercio asociado',
                HttpStatus.UNAUTHORIZED
            );
        }

        const commerceId = req.user.commerceId;

        try {
            return await this.createOrRefreshUseCase.execute({ commerceId, code });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            throw new HttpException(
                `No se pudo conectar con MercadoPago: ${message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @ApiOperation({ summary: 'Webhook de MercadoPago' })
    @Post()
    async mercadopagoWebhook(@Body() body: any) {
        try {
            const { type, data } = body;

            if (type === 'payment' && data?.id) {
                const paymentId = data.id;

                await this.verifyPaymentUseCase.execute(paymentId);
                return { received: true };
            }

            return { received: true };
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Error desconocido';
            throw new HttpException(
                `Error procesando webhook: ${message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
