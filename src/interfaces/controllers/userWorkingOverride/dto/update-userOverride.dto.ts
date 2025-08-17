import { AvailabilityType } from '@/domain/common/AvailabilityType';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsString,
  IsOptional,
  IsMilitaryTime,
  IsDate,
} from 'class-validator';

export class UpdateUserOverrideDto {
  @ApiProperty({
    example: 'full',
    description: 'Rango horario trabajado',
  })
  @Type(() => String)
  @IsString({ message: 'El rango horario debe ser una cadena de texto' })
  @IsIn([AvailabilityType.full, AvailabilityType.half, AvailabilityType.off], {
    message: 'El rango horario debe ser un rango válido',
  })
  availabilityType: AvailabilityType;

  @ApiProperty({
    example: '2025-08-16',
    description: 'Fecha',
    required: false,
  })
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @IsOptional()
  date?: Date;

  @ApiProperty({
    example: '09:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @IsMilitaryTime({
    message: 'La hora de inicio de la mañana debe tener el formato HH:mm',
  })
  morningStart?: string;

  @ApiProperty({
    example: '13:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @IsMilitaryTime({
    message: 'La hora de fin de la mañana debe tener el formato HH:mm',
  })
  morningEnd?: string;

  @ApiProperty({
    example: '14:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @IsMilitaryTime({
    message: 'La hora de inicio de la tarde debe tener el formato HH:mm',
  })
  afternoonStart?: string;

  @ApiProperty({
    example: '18:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @IsMilitaryTime({
    message: 'La hora de fin de la tarde debe tener el formato HH:mm',
  })
  afternoonEnd?: string;

  @ApiProperty({
    example: 'Notes',
    description: 'Notas',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}
