import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserConfigDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  userId: number;

  @ApiProperty({
    example: true,
    description: 'Modo oscuro',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'El modo oscuro debe ser un booleano' })
  darkMode?: boolean;

  @ApiProperty({
    example: true,
    description: 'Recibir notificaciones',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'Debe ser un booleano' })
  reminder?: boolean;

  @ApiProperty({
    example: 60,
    description: 'Frecuencia de las notificaciones en minutos',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La frecuencia debe ser un número' })
  reminderFrequency?: number;
}
