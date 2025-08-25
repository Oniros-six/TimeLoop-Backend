import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { WeekDays } from '@/domain/dbEnums/weekdays';

export class VerifyUserPatternDto {
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
}
