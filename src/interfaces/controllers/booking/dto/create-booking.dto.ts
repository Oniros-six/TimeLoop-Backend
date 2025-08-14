import {
  IsString,
  IsNumber,
  IsDate,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
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

  @ApiProperty({ example: 1, description: 'ID del servicio reservado' })
  @IsNumber({}, { message: 'El ID de servicio debe ser un número' })
  @IsNotEmpty({ message: 'El servicio es requerido' })
  serviceId: number;

  @ApiProperty({
    example: '2025-07-08T17:30:00.000Z',
    description: 'Dia y hora de inicio de la reserva',
  })
  @Type(() => Date)
  @IsDate({ message: 'La hora de inicio debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  timeStart: Date;

  @ApiProperty({
    example: '2025-07-08T00:00:00.000Z',
    description: 'En que fecha ser realizo la reserva',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: Date;

  @ApiProperty({ example: 1, description: 'Estado actual de la reserva' })
  @IsNumber({}, { message: 'El ID de estado debe ser un número' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  statusid: number;

  @ApiProperty({
    example: 90,
    description: 'Duración de la reserva en minutos',
  })
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsNotEmpty({ message: 'La duración es requerida' })
  @Min(1, { message: 'La duración debe ser mayor a 0 minutos' })
  duration: number;

  @ApiProperty({
    example: 'Soy alergico a ... y preciso ...',
    description: 'Nota para el encargo de recibir la reserva',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MinLength(10, { message: 'Las notas deben tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}
