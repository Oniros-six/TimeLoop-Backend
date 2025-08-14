import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del cliente',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del cliente debe ser un número' })
  customerId: number;

  @ApiProperty({
    example: 1,
    description: 'ID de la entidad',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la entidad debe ser un número' })
  entityId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del tipo de entidad',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la entidad debe ser un número' })
  entityTypeId: number;

  @ApiProperty({
    example: "Customer created",
    description: 'Detalle del log',
  })
  @IsString({})
  detail: string;
}
