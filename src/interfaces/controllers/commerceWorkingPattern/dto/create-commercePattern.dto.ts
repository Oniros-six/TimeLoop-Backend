import { AvailabilityType  } from '@/domain/common/AvailabilityType';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsMilitaryTime,
} from 'class-validator';

export class CreateCommercePatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  @IsNotEmpty({ message: 'El ID del comercio es requerido' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'Día de la semana',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El día de la semana debe ser un número' })
  @IsIn([0, 1, 2, 3, 4, 5, 6], {
    message: 'El día de la semana debe ser un número entre 0 y 6',
  })
  @IsNotEmpty({ message: 'El día de la semana es requerido' })
  weekday: number;

  @ApiProperty({
    example: 'full',
    description: 'Rango horario trabajado',
  })
  @Type(() => String)
  @IsString({ message: 'El rango horario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El rango horario es requerido' })
  @IsIn(
    [
      AvailabilityType.full,
      AvailabilityType.half,
      AvailabilityType.off,
    ],
    { message: 'El rango horario debe ser un rango válido' },
  )
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
