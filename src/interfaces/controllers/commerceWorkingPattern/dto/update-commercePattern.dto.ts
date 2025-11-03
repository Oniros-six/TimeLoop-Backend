import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsString, IsOptional, Matches, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateCommercePatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del patrón de trabajo',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del patrón de trabajo debe ser un número' })
  @IsNotEmpty({ message: 'El ID del patrón de trabajo es requerido' })
  id: number;
  
  @ApiProperty({
    example: 'full',
    description: 'Rango horario abierto',
  })
  @Type(() => String)
  @IsString({ message: 'El rango horario debe ser una cadena de texto' })
  @IsIn([AvailabilityType.full, AvailabilityType.half, AvailabilityType.off], {
    message: 'El rango horario debe ser un rango válido',
  })
  availabilityType: AvailabilityType;

  @ApiProperty({
    example: '09:00',
    description: 'Hora de inicio de la mañana',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm',
  })
  morningStart: string | null;

  @ApiProperty({
    example: '13:00',
    description: 'Hora de fin de la mañana',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm',
  })
  morningEnd: string | null;

  @ApiProperty({
    example: '14:00',
    description: 'Hora de inicio de la tarde',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm',
  })
  afternoonStart: string | null;

  @ApiProperty({
    example: '18:00',
    description: 'Hora de fin de la tarde',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm',
  })
  afternoonEnd: string | null;
}
