import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { WeekDays } from '@/domain/dbEnums/Weekdays.enum';
import { BusinessCategory } from '@/domain/dbEnums/BusinessCategory.enum';

class ShiftDto {
  @ApiProperty({ example: '09:00', description: 'Hora de apertura (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato de la hora debe ser HH:mm',
  })
  morningOpen: string;

  @ApiProperty({ example: '18:00', description: 'Hora de cierre (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato de la hora debe ser HH:mm',
  })
  morningClose: string;
  @ApiProperty({ example: '09:00', description: 'Hora de apertura (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato de la hora debe ser HH:mm',
  })
  afternoonOpen: string;

  @ApiProperty({ example: '18:00', description: 'Hora de cierre (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El formato de la hora debe ser HH:mm',
  })
  afternoonClose: string;
}

class WorkingDayDto {
  @ApiProperty({
    example: 'MONDAY',
    description: 'Día de la semana en inglés',
    enum: WeekDays,
  })
  @IsEnum(WeekDays, { message: 'El día de la semana debe estar en inglés' })
  weekday: WeekDays;

  @ApiProperty({ type: [ShiftDto] })
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts: ShiftDto[];
}

export class CreateBusinessDto {
  //* Cuenta
  @ApiProperty({ example: 'Leandro', description: 'Nombre del usuario' })
  @IsString({ message: 'El nombre tiene que contener solo letras' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre no debe tener más de 15 caracteres' })
  ownerName: string;

  @ApiProperty({
    example: 'usuario@dominio.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty()
  @MinLength(10)
  password: string;

  //* Datos del negocio
  @ApiProperty({
    example: 'GlobalTechnologySolutions',
    description: 'Nombre del comercio',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: '092601809',
    description: 'Teléfono de contacto del comercio',
  })
  @Matches(/^09\d{7}$/, {
    message: 'El número debe comenzar con 09 y tener 9 dígitos',
  })
  phone: string;

  @ApiProperty({
    example: 'Magallanes esq Zufriategui',
    description: 'Dirección del comercio',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  address: string;

  @ApiProperty({
    example: 'Barberia',
    description: 'Categoría del comercio',
    enum: BusinessCategory,
  })
  @IsNotEmpty()
  businessCategory: BusinessCategory;

  //* Configuración de horarios
  @ApiProperty({
    type: [WorkingDayDto],
    description: 'Horarios de trabajo por día',
  })
  @ValidateNested({ each: true })
  @Type(() => WorkingDayDto)
  schedules: WorkingDayDto[];
}
