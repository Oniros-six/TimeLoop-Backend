import {
  IsString,
  IsNumber,
  IsDate,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
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
    description: 'Fecha y hora de la reserva (ISO 8601 con zona horaria)',
  })
  @Type(() => Date)
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
