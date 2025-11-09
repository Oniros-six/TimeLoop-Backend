import {
  IsString,
  IsNumber,
  IsDate,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { toUTC } from '@/domain/value-objects/booking/validations';

export class CreateBookingDto {
  @ApiProperty({
    example: 'booking_550e8400-e29b-41d4-a716-446655440000',
    description:
      'Clave única de idempotencia. Si se envía la misma key en múltiples requests, solo se creará una reserva. ' +
      'Útil para prevenir duplicados por doble-click o retry automático. ' +
      'Formato recomendado: "booking_{UUID}"',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La clave de idempotencia debe ser texto' })
  @MaxLength(255, { message: 'La clave no puede exceder 255 caracteres' })
  idempotencyKey?: string;

  @ApiProperty({
    example: 1,
    description: 'ID del comercio en el que se reserva',
  })
  @IsNumber({}, { message: 'El ID de comercio debe ser un número' })
  @IsNotEmpty({ message: 'El comercio es requerido' })
  commerceId: number;

  @ApiProperty({ example: 1, description: 'ID del cliente que reserva' })
  @IsNumber({}, { message: 'El ID de cliente debe ser un número' })
  @IsNotEmpty({ message: 'El cliente es requerido' })
  customerId: number;

  @ApiProperty({ example: 1, description: 'ID del empleado que atiende' })
  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  @IsNotEmpty({ message: 'El empleado es requerido' })
  userId: number;

  @ApiProperty({
    description: 'IDs de servicios',
    example: [1, 3],
    required: true,
  })
  @IsNumber({}, { each: true })
  serviceIds: number[];

  @ApiProperty({
    example: '2025-07-08T15:00:00-03:00',
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria). Se almacenará en UTC.',
  })
  @Type(() => Date)
  @Transform(({ value }) => toUTC(new Date(value)))
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  timeStart: Date;

  @ApiProperty({
    example: 'Soy alergico a ... y preciso ...',
    description: 'Nota para el encargo de recibir la reserva',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}
