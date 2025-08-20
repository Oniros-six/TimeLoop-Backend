import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID del comercio',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comercio debe ser un número' })
  @IsNotEmpty({ message: 'El ID del comercio es requerido' })
  commerceId: number;

  @ApiProperty({ example: 'Leandro', description: 'Nombre del usuario' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre no debe tener más de 15 caracteres' })
  name: string;

  @ApiProperty({
    example: 'usuario@dominio.com',
    description: 'Email del usuario',
  })
  @IsEmail(
    {
      allow_display_name: false,
      require_tld: true,
      allow_utf8_local_part: true,
    },
    {
      message: 'El correo electrónico no es válido',
    },
  )
  @MaxLength(100, {
    message: 'El correo electrónico no debe superar los 100 caracteres',
  })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'El correo debe tener un formato válido (ej. usuario@dominio.com)',
  })
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(10)
  password: string;

  @ApiProperty({
    example: 1,
    description: 'Rol del usuario (1: Admin, 2: Empleado)',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsIn([1, 2], { message: 'El rol no es válido' })
  role: number;
}
