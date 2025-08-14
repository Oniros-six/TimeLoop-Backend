import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio donde se hizo la resereva',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del cliente que cancela la reserva',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del cliente debe ser un número' })
  customerId: number;
}
