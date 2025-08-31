import { CreatePayment } from '@/application/use-cases/payment/create-payment.use-case'
import { GetPaymentsByBooking } from '@/application/use-cases/payment/get-payments-by-booking.use-case'

import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@Controller('payment')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePayment,
    private readonly getPaymentsByBookingUseCase: GetPaymentsByBooking,
  ) {}

  @ApiOperation({ summary: 'Crear un pago' })
  @ApiBody({ type: CreatePaymentDto })
  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.createPaymentUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Obtener los pagos realizados en una reserva' })
  @ApiParam({
    name: 'bookingId',
    type: Number,
    required: true,
    description: 'ID de la reserva',
  })
  @Get('booking/:bookingId')
  async getPayments(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.getPaymentsByBookingUseCase.execute(bookingId);
  }
}
