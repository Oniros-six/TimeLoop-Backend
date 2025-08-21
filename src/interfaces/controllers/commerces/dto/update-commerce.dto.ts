import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class UpdateCommerceDto {
  @ApiProperty({
    example: 'Comercio Ejemplo',
    description: 'Nombre del comercio',
    required: false,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no debe superar los 50 caracteres' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'contacto@comercio.com',
    description: 'Correo electrónico del comercio',
    required: false,
  })
  @IsEmail({}, { message: 'El correo electrónico no es valido' })
  @MinLength(5, { message: 'El mail debe tener minimo 5 caracteres' })
  @MaxLength(100, {
    message: 'El correo electrónico no debe superar los 100 caracteres',
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '099123456',
    description: 'Teléfono de contacto del comercio',
    required: false,
  })
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Av. Principal 1234',
    description: 'Dirección del comercio',
    required: false,
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MinLength(10, { message: 'La dirección debe tener minimo 10 caracteres' })
  @MaxLength(200, {
    message: 'La dirección no debe superar los 200 caracteres',
  })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Peluqueria',
    description: 'Categoría del comercio',
    required: false,
    enum: BusinessCategory,
  })
  @IsOptional()
  businessCategory?: BusinessCategory;
}
