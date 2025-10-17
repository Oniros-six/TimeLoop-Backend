import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class FindByUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario del cual consultamos sus reservas',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Cantidad de resultados por página (por defecto 10)',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  limit?: number;

  @ApiPropertyOptional({
    example: 42,
    description: 'ID del último registro obtenido, usado para paginado con cursor',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'El cursor debe ser un número' })
  cursor?: number;
}
