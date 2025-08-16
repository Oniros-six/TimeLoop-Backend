import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FindUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario',
    required: false,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;
}
