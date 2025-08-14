import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FindByCommerceDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio del cual consultamos sus reservas',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;
}
