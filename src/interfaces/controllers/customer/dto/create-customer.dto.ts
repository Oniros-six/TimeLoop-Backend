import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Leandro', description: 'Nombre del cliente' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    example: 'usuario@dominio.com',
    description: 'Email del cliente',
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
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @ApiProperty({
    example: '099123456',
    description: 'Número de telefono del cliente',
  })
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  @IsNotEmpty({ message: 'El telefono es requerido' })
  phone: string;
}
