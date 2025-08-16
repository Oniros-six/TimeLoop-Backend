import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateCommerceConfigDto {
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
    description: 'Permitir cancelaciones',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'El allowCancel debe ser un booleano' })
  allowCancel?: boolean;

  @ApiProperty({
    example: true,
    description: 'Permitir reprogramaciones',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'El allowReschedule debe ser un booleano' })
  allowReschedule?: boolean;

  @ApiProperty({
    example: true,
    description: 'Permitir notificaciones',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'El allowNotifications debe ser un booleano' })
  allowNotifications?: boolean;

  @ApiProperty({
    example: 45,
    description: 'Duración estándar de las reservas en minutos',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  standardDurationMinutes?: number;

  @ApiProperty({
    example: "Bienvenidos a ...",
    description: 'Mensaje de bienvenida en la pagina',
  })
  @IsString({ message: 'El welcomeMessage debe ser un string' })
  welcomeMessage?: string;

  @ApiProperty({
    example: '0000-00-00T09:00:00.000Z',
    description: 'La hora de apertura del comercio',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  openTime: Date;

  @ApiProperty({
    example: '0000-00-00T21:00:00.000Z',
    description: 'La hora de cierre del comercio',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  closeTime: Date;
}
