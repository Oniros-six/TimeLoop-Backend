import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateHoldDto } from './dto/create-hold.dto';
import { CreateHold } from '@/application/use-cases/booking/create-hold.use-case';
import { ConfirmHold } from '@/application/use-cases/booking/confirm-hold.use-case';

/**
 * Controlador para operaciones de Hold (prereservas temporales)
 * 
 * FLUJO TÍPICO:
 * 1. POST /booking/hold → Crea prereserva de 15 min
 * 2. Cliente completa proceso de pago
 * 3. POST /booking/hold/:id/confirm → Convierte a PENDING
 * 4. Si no confirma en 15 min → Cron elimina automáticamente
 * 
 * NOTA: Si necesitas autenticación, agrega @UseGuards() cuando implementes el guard.
 */
@ApiTags('Booking - Hold System')
@Controller('booking/hold')
export class BookingHoldController {
  constructor(
    private readonly createHoldUseCase: CreateHold,
    private readonly confirmHoldUseCase: ConfirmHold,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prereserva temporal (15 minutos)',
    description: `
      Crea una prereserva temporal que bloquea el horario por 15 minutos.
      
      Durante estos 15 minutos:
      - El horario NO estará disponible para otros usuarios
      - El cliente puede completar el proceso de pago
      - Si no se confirma, un worker automático eliminará la prereserva
      
      Después de crear la prereserva, usar el endpoint /confirm para convertirla en reserva.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Prereserva creada exitosamente. Expira en 15 minutos.',
    schema: {
      example: {
        message: 'Horario prereservado. Complete el pago en 15 minutos.',
        statusCode: 201,
        data: {
          holdId: 123,
          expiresAt: '2024-11-09T15:45:00.000Z',
          expiresInSeconds: 900,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El horario ya no está disponible (ocupado o prereservado por otro usuario)',
  })
  @ApiResponse({
    status: 404,
    description: 'Servicio o usuario no encontrado',
  })
  async createHold(@Body() dto: CreateHoldDto) {
    return this.createHoldUseCase.execute(dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar prereserva y convertirla en reserva PENDING',
    description: `
      Convierte una prereserva temporal en una reserva permanente con status PENDING.
      
      Este endpoint se debe llamar después de que el cliente avance en el flujo
      de checkout (antes de 15 minutos).
      
      Si la prereserva ya expiró (> 15 minutos), retornará error 410 GONE.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Prereserva confirmada exitosamente, ahora es una reserva PENDING',
    schema: {
      example: {
        message: 'Reserva confirmada exitosamente',
        statusCode: 200,
        data: {
          id: 123,
          status: 'PENDING',
          timeStart: '2024-11-15T10:00:00.000Z',
          timeEnd: '2024-11-15T11:30:00.000Z',
          // ... resto de campos de booking
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Prereserva no encontrada',
  })
  @ApiResponse({
    status: 410,
    description: 'Prereserva expirada (> 15 minutos). Debe crear una nueva prereserva.',
  })
  @ApiResponse({
    status: 400,
    description: 'La reserva no tiene status HOLD (ya fue confirmada o cancelada)',
  })
  async confirmHold(@Param('id', ParseIntPipe) id: number) {
    return this.confirmHoldUseCase.execute(id);
  }
}

