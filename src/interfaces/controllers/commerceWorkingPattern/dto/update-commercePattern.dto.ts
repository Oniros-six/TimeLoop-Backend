import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsString, IsOptional, Matches } from 'class-validator';

export class UpdateCommercePatternDto {
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
    example: '09:00:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  morningStart?: string;

  @ApiProperty({
    example: '13:00:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  morningEnd?: string;

  @ApiProperty({
    example: '14:00:00',
    description: 'Hora de inicio',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  afternoonStart?: string;

  @ApiProperty({
    example: '18:00:00',
    description: 'Hora de fin',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  afternoonEnd?: string;
}
