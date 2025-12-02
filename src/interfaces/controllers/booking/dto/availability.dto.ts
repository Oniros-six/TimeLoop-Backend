import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsNumber, IsDate, IsArray, ArrayMinSize } from 'class-validator';
import { toUTC } from '@/domain/value-objects/booking/validations';

export class AvailabilityDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario/empleado',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;

  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha para consultar disponibilidad (ISO 8601 con zona horaria). Se procesará en UTC.',
  })
  @Type(() => Date)
  @Transform(({ value }) => toUTC(new Date(value)))
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date: Date;

  @ApiProperty({
    description: 'IDs de servicios para los cuales se consulta la disponibilidad',
    example: [1, 3],
    type: [Number],
    isArray: true,
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    return [Number(value)];
  })
  @IsArray({ message: 'Los servicios deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe especificar al menos un servicio' })
  @IsNumber({}, { each: true, message: 'Cada servicio debe ser un número' })
  services: number[];
}

