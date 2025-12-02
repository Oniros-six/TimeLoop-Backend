import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { toUTC } from '@/domain/value-objects/booking/validations';

/**
 * DTO para crear un hold temporal (prereserva de 5 minutos)
 */
export class CreateHoldDto {
  @ApiProperty({
    description: 'ID del cliente que hace la prereserva',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({
    description: 'ID del comercio donde se hace la prereserva',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  commerceId: number;

  @ApiProperty({
    description: 'ID del empleado que atenderá',
    example: 2,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Array de IDs de servicios solicitados',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  serviceIds: number[];

  @ApiProperty({
    description: 'Fecha y hora de inicio (se normalizará a UTC automáticamente)',
    example: '2024-11-15T10:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => toUTC(new Date(value)))
  timeStart: Date;

  @ApiProperty({
    description: 'Notas opcionales para la prereserva',
    example: 'Cliente prefiere ventana',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Clave de idempotencia opcional para evitar duplicados en prereservas',
    required: false,
    example: 'hold-1234-abc',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;
}

