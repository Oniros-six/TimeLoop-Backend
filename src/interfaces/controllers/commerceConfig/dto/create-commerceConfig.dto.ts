import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCommerceConfigDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  @IsNotEmpty({ message: 'El ID del comercio es requerido' })
  commerceId: number;

  @ApiProperty({
    example: true,
    description: 'Permitir notificaciones',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'El allowNotifications debe ser un booleano' })
  @IsNotEmpty({ message: 'El allowNotifications es requerido' })
  allowNotifications: boolean;

  @ApiProperty({
    example: 45,
    description: 'Duración estándar de las reservas en minutos',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsNotEmpty({ message: 'La duración es requerida' })
  standardDurationMinutes: number;

  @ApiProperty({
    example: 'Bienvenidos a ...',
    description: 'Mensaje de bienvenida en la pagina',
  })
  @IsString({ message: 'El welcomeMessage debe ser un string' })
  @IsNotEmpty({ message: 'El welcomeMessage es requerido' })
  welcomeMessage: string;

  @ApiProperty({
    example: '09:00:00',
    description: 'La hora de apertura del comercio',
  })
  @IsNotEmpty({ message: 'La fecha de apertura es requerida' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  openTime: string;

  @ApiProperty({
    example: '21:00:00',
    description: 'La hora de cierre del comercio',
  })
  @IsNotEmpty({ message: 'La fecha de cierre es requerida' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato debe ser HH:mm:ss',
  })
  closeTime: string;
}
