import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsNumber, IsDate } from 'class-validator';
import { toUTC } from '@/domain/value-objects/booking/validations';

export class FindByDateAndUserDto {
  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria). Se procesará en UTC.',
  })
  @Type(() => Date)
  @Transform(({ value }) => toUTC(new Date(value)))
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  date: Date;

  @ApiProperty({
    example: 1,
    description:
      'ID del usuario/empleado del cual consultamos sus horarios disponibles',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;
}
