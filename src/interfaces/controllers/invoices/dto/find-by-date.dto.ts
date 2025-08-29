import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class FindByCommerceDateDto {
    @ApiProperty({
        example: '2025-07-08T15:00:00-03:00',
        description: 'Fecha y hora de inicio en la busqueda',
    })
    @Type(() => Date)             // <-- esto convierte el string ISO a Date
    @IsDate({ message: 'La fecha debe ser una fecha válida' })
    startPeriod: Date;

    @ApiProperty({
        example: '2025-07-08T15:00:00-03:00',
        description: 'Fecha y hora de fin en la busqueda',
    })
    @Type(() => Date)             // <-- esto convierte el string ISO a Date
    @IsDate({ message: 'La fecha debe ser una fecha válida' })
    endPeriod: Date;
}
