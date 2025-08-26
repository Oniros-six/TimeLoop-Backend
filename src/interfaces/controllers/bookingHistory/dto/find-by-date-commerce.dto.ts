import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsDate } from 'class-validator';

export class FindByDateCommerceDto {
  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de inicio en la busqueda',
  })
  @Type(() => Date)             // <-- esto convierte el string ISO a Date
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  startDate: Date;
  
  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de fin en la busqueda',
  })
  @Type(() => Date)             // <-- esto convierte el string ISO a Date
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  endDate: Date;

  @ApiProperty({
    example: 1,
    description:
      'ID del comercio del cual consultamos su historial',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;
}
