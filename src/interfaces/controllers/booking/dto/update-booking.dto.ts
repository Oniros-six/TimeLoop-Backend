import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, Matches } from 'class-validator';

export class UpdateBookingDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio en el que se reserva',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({ example: 1, description: 'ID del cliente que reserva' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del cliente debe ser un número' })
  customerId: number;

  @ApiProperty({ description: 'Nuevo ID de servicio', example: 3 })
  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date?: Date;

  @ApiProperty({ description: 'Notas adicionales' })
  @IsOptional()
  notes?: string;
}
