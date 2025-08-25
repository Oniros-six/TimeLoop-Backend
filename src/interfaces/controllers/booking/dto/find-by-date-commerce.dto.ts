import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsDate } from 'class-validator';

export class FindByDateAndCommerceDto {
  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria)',
  })
  @Type(() => Date)             // <-- esto convierte el string ISO a Date
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date: Date;

  @ApiProperty({
    example: 1,
    description:
      'ID del comercio del cual consultamos sus horarios disponibles',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;
}
