import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class CreateCommerceDto {
  @ApiProperty({
    example: 'Comercio Ejemplo',
    description: 'Nombre del comercio',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no debe superar los 50 caracteres' })
  name: string;

  @ApiProperty({
    example: 'contacto@comercio.com',
    description: 'Correo electrónico del comercio',
    required: true,
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MinLength(5, { message: 'El mail debe tener minimo 5 caracteres' })
  @MaxLength(100, {
    message: 'El correo electrónico no debe superar los 100 caracteres',
  })
  email: string;

  @ApiProperty({
    example: '099123456',
    description: 'Teléfono de contacto del comercio',
    required: true,
  })
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  phone: string;

  @ApiProperty({
    example: 'Av. Principal 1234',
    description: 'Dirección del comercio',
    required: true,
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MinLength(10, { message: 'La dirección debe tener minimo 10 caracteres' })
  @MaxLength(200, {
    message: 'La dirección no debe superar los 200 caracteres',
  })
  address: string;

  @ApiProperty({
    example: 'Peluqueria',
    description: 'Categoría del comercio',
    required: true,
    enum: BusinessCategory,
  })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  businessCategory: BusinessCategory;
}
