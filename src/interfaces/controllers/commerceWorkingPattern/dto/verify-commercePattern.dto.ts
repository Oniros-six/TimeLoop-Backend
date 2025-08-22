import { WeekDays } from '@/domain/common/weekdays';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyCommercePatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 'MONDAY',
    description: 'Día de la semana',
  })
  @IsEnum(WeekDays, { message: 'El día de la semana debe estar en ingles' })
  @IsNotEmpty({ message: 'El día de la semana es requerido' })
  weekday: WeekDays;
}
