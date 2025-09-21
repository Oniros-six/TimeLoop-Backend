import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class DeleteServiceDto {
@ApiProperty({
    example: 1,
    description: 'ID del servicio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del servicio debe ser un número' })
  id: number;
}
