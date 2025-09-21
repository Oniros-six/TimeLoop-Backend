import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  @IsNotEmpty({ message: 'El ID del comercio es requerido' })
  commerceId: number;
  
  @ApiProperty({
    example: 1,
    description: 'ID del usuario/empleado',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  userId: number;

  @ApiProperty({ example: 'Corte de pelo', description: 'Nombre del servicio' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @ApiProperty({
    example: '200',
    description: 'Costo del servicio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsNotEmpty({ message: 'El precio es requerido' })
  @Min(100, { message: 'El precio debe tener al menos 3 dígitos' })
  price: number;

  @ApiProperty({
    example: '20',
    description: 'Duración del servicio en minutos',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsNotEmpty({ message: 'La duración es requerida' })
  @Min(10, { message: 'La duración debe ser mas de 10 minutos' })
  durationMinutes: number;
}
