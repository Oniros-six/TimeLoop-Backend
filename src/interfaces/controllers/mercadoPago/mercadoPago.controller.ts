import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query,
    Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrRefresh } from '@/application/use-cases/mercadoPago/create-or-refresh.use-case'

@ApiTags('Mercado pago')
@Controller('mercadopago')
export class MercadoPagoController {
    constructor(
        private readonly createOrRefresh: CreateOrRefresh
    ) { }

    @ApiOperation({ summary: 'Callback de OAuth de MercadoPago' })
    @Get('mercadopago/oauth/callback')
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
            return await this.createOrRefresh.execute({ commerceId, code });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            throw new HttpException(
                `No se pudo conectar con MercadoPago: ${message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
