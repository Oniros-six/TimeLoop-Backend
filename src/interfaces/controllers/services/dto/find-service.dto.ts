import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FindServiceDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del servicio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del servicio debe ser un número' })
  id: number;
}
