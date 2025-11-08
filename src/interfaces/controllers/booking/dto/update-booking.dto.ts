import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { toUTC } from '@/domain/value-objects/booking/validations';

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

  @ApiProperty({
    description: 'IDs de servicios',
    example: [1, 3],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  serviceIds?: number[];

  @ApiProperty({ example: 1, description: 'ID del empleado que atiende' })
  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  userId: number;

  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria). Se almacenará en UTC.',
  })
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => value ? toUTC(new Date(value)) : undefined)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  timeStart?: Date;

  @ApiProperty({ description: 'Notas adicionales' })
  @IsOptional()
  notes?: string;
}
