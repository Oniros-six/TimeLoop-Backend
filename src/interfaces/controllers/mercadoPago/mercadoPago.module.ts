import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MercadoPagoController } from './mercadoPago.controller';

// Use cases
import { CreateOrRefresh } from '@/application/use-cases/mercadoPago/create-or-refresh.use-case';

// Tokens
import {
    MERCADO_PAGO_REPOSITORY,
} from '@/application/providers';

// Repositories
import { PrismaMercadoPagoRepository } from '@/infrastructure/prisma/repositories/mercadoPago.repository';

@Module({
    imports: [PrismaModule],
    controllers: [MercadoPagoController],
    providers: [
        {
            provide: MERCADO_PAGO_REPOSITORY,
            useClass: PrismaMercadoPagoRepository,
        },
        
        CreateOrRefresh
    ],
})
export class MercadoPagoModule { }
