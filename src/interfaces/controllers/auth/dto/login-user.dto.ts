import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
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
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres' })
  password: string;
}
