import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({ example: 'Corte de pelo', description: 'Nombre del servicio' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name?: string;

  @ApiProperty({
    example: '200',
    description: 'Costo del servicio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @MinLength(3, { message: 'El precio debe tener al menos 3 dígitos' })
  price?: number;

  @ApiProperty({
    example: '20',
    description: 'Duración del servicio en minutos',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @MinLength(2, { message: 'La duración debe tener al menos 2 dígitos' })
  durationMinutes?: number;
}
