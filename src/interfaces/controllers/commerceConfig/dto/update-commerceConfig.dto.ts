import { BillingTypes } from '@/domain/dbEnums/BillingTypes.enum';
import { PaymentMethod } from '@/domain/dbEnums/PaymentMethods.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class UpdateCommerceConfigDto {
  @ApiProperty({
    example: 45,
    description:
      'Tiempo límite (en minutos) antes de la reserva en el que aún se permite cancelar o reprogramar',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El tiempo debe ser un número' })
  cancellationDeadlineMinutes: number;

  @ApiProperty({
    example: 'Bienvenidos a ...',
    description: 'Mensaje de bienvenida en la pagina',
  })
  @IsString({ message: 'El welcomeMessage debe ser un string' })
  welcomeMessage?: string;

  @ApiProperty({
    example: [PaymentMethod.MERCADO_PAGO, PaymentMethod.CASH],
    description: 'Métodos de pago habilitados por el comercio',
    enum: PaymentMethod,
    isArray: true,
  })
  @IsEnum(PaymentMethod, { each: true, message: 'Método de pago no válido' })
  acceptedPaymentMethods?: PaymentMethod[];
  
  @ApiProperty({
    example: [BillingTypes.FLAT, BillingTypes.FLEXIBLE],
    description: 'Plan facturación escogido por el comercio',
    enum: BillingTypes,
  })
  @IsEnum(BillingTypes, { each: true, message: 'Plan inexistente' })
  billingType?: BillingTypes;
}
