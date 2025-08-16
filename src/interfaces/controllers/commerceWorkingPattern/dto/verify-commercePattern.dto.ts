import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber } from 'class-validator';

export class VerifyCommercePatternDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
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
  weekday: number;
}
