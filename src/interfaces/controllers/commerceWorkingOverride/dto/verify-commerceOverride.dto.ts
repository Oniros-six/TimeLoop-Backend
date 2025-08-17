import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyCommerceOverrideDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  @IsNotEmpty({ message: 'El ID del comercio es requerido' })
  commerceId: number;

  @ApiProperty({
    example: '2025-08-16',
    description: 'Fecha',
    required: true,
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: Date;
}
