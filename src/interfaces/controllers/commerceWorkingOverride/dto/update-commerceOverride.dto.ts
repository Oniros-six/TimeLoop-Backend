import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsString, IsOptional, IsDate, Matches } from 'class-validator';

export class UpdateCommerceOverrideDto {
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
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @IsOptional()
  date?: Date;

  @ApiProperty({
    example: '09:00:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  morningStart: string | null;

  @ApiProperty({
    example: '13:00:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  morningEnd: string | null;

  @ApiProperty({
    example: '14:00:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  afternoonStart: string | null;

  @ApiProperty({
    example: '18:00:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  afternoonEnd: string | null;

  @ApiProperty({
    example: 'Notes',
    description: 'Notas',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}
