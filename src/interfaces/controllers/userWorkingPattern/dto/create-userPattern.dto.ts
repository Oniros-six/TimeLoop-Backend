import { AvailabilityType } from '@/domain/common/AvailabilityType';
import { WeekDays } from '@/domain/common/weekdays';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsMilitaryTime,
  IsEnum,
} from 'class-validator';

export class CreateUserPatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  userId: number;

  @ApiProperty({
    example: 'MONDAY',
    description: 'Día de la semana',
  })
  @IsEnum(WeekDays, { message: 'El día de la semana debe estar en ingles' })
  @IsNotEmpty({ message: 'El día de la semana es requerido' })
  weekday: WeekDays;

  @ApiProperty({
    example: 'full',
    description: 'Rango horario trabajado',
  })
  @Type(() => String)
  @IsString({ message: 'El rango horario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El rango horario es requerido' })
  @IsIn([AvailabilityType.full, AvailabilityType.half, AvailabilityType.off], {
    message: 'El rango horario debe ser un rango válido',
  })
  availabilityType: AvailabilityType;

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
}
