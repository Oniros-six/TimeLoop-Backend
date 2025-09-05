// src/interfaces/controllers/payment/dto/process-refund.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ProcessRefundDto {
  @ApiProperty({
    example: 1,
    description: 'ID del pago a reembolsar',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del pago debe ser un número' })
  @IsNotEmpty({ message: 'El ID del pago es requerido' })
  paymentId: number;
}
