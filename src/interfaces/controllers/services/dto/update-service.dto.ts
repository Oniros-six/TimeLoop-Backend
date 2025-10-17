import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({ example: 1, description: 'ID del servicio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del servicio debe ser un número' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID del comercio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  commerceId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario/empleado',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;

  @ApiProperty({ example: 'Corte de pelo', description: 'Nombre del servicio' })
  @IsOptional()
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name?: string;

  @ApiProperty({
    example: 'Corte de cabello tradicional adaptado a tu estilo. Incluye lavado, corte con tijera y máquina, retoque de contornos y peinado con producto de terminación. Ideal para quienes buscan un look prolijo y fresco.',
    description: 'Descripción del servicio'
  })
  @IsOptional()
  @IsString({ message: 'La descripción tiene que contener solo letras' })
  @MaxLength(500, { message: 'La descripción debe contenter maximo 500 caracteres' })
  description?: string;

  @ApiProperty({
    example: '200',
    description: 'Costo del servicio',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(100, { message: 'El precio debe tener al menos 3 dígitos' })
  price?: number;

  @ApiProperty({
    example: '20',
    description: 'Duración del servicio en minutos',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @Min(10, { message: 'La duración debe ser mas de 10 minutos' })
  durationMinutes?: number;
}
