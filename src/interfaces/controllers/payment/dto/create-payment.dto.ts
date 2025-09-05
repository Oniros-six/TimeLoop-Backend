import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { Currency } from "@/domain/dbEnums/Currency.enum";
import { PaymentMethod } from "@/domain/dbEnums/PaymentMethods.enum";

export class CreatePaymentDto {
    @ApiProperty({
        example: 1,
        description: 'ID de la reserva asociada al pago',
    })
    @Type(() => Number)
    @IsNumber({}, { message: 'El ID de la reserva debe ser un número' })
    @IsNotEmpty({ message: 'El ID de la reserva es requerido' })
    bookingId: number;

    @ApiProperty({
        example: Currency.UYU,
        enum: Currency,
        description: 'Moneda en la que se realiza el pago',
    })
    @IsEnum(Currency, { message: 'La moneda no es válida' })
    currency: Currency;

    @ApiProperty({
        example: PaymentMethod.MERCADO_PAGO,
        enum: PaymentMethod,
        description: 'Proveedor de pago seleccionado',
    })
    @IsEnum(PaymentMethod, { message: 'El proveedor de pago no es válido' })
    paymentProvider: PaymentMethod;
}
