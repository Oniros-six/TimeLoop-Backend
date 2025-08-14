import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsDateString } from 'class-validator';

export class FindByDateAndCommerceDto {
  @ApiProperty({
    example: '2025-07-08T00:00:00.000Z',
    description: 'Fecha en la que interesa saber que espacios disponibles hay',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato válido (ISO)' })
  date: string;

  @ApiProperty({
    example: 1,
    description:
      'ID del comercio del cual consultamos sus horarios disponibles',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;
}
