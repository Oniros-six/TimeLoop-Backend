import { Roles } from '@/domain/dbEnums/UserRoles.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Leandro', description: 'Nombre del usuario' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no debe superar los 50 caracteres' })
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
    example: '099123456',
    description: 'Teléfono de contacto del usuario',
    required: false,
  })
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Duración del servicio en minutos',
  })
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres' })
  @IsOptional({})
  password: string;

  @ApiProperty({
    example: 1,
    description: 'Rol del usuario (1: Admin, 2: Empleado)',
  })
  @IsEnum(Roles, { message: 'El rol debe ser Admin o Empleado' })
  @IsOptional()
  role: Roles;
}
