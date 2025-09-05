import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiProperty({ example: 'Leandro', description: 'Nombre del cliente' })
  @IsOptional()
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  name?: string;

  @ApiProperty({
    example: 'usuario@dominio.com',
    description: 'Email del cliente',
  })
  @IsOptional()
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
  email?: string;

  @ApiProperty({
    example: '099123456',
    description: 'Número de telefono del cliente',
  })
  @IsOptional()
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  phone?: string;
}
