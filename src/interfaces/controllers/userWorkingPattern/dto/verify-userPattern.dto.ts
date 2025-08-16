import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber } from 'class-validator';

export class VerifyUserPatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'Día de la semana',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El día de la semana debe ser un número' })
  @IsIn([0, 1, 2, 3, 4, 5, 6], {
    message: 'El día de la semana debe ser un número entre 0 y 6',
  })
  weekday: number;
}
