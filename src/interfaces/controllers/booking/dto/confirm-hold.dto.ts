import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * DTO para confirmar un hold (prereserva temporal)
 * 
 * Se usa cuando el cliente completa todo el proceso de checkout,
 * independientemente de si pagó o no. Convierte HOLD → PENDING.
 */
export class ConfirmHoldDto {
  @ApiProperty({
    description: 'ID del cliente que creó la prereserva (debe coincidir con el hold)',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  customerId: number;
}

