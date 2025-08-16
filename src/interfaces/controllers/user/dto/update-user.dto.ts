import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Leandro', description: 'Nombre del usuario' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre debe tener como máximo 15 caracteres' })
  @IsOptional({})
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
  @IsOptional({})
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Duración del servicio en minutos',
  })
  @MinLength(10)
  @IsOptional({})
  password: string;

  @ApiProperty({
    example: 1,
    description: 'Rol del usuario (1: Admin, 2: Empleado)',
  })
  @IsNumber()
  @IsIn([1, 2], { message: 'El rol no es válido' })
  @IsOptional()
  role: number;
}
