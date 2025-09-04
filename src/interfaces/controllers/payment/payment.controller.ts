// src/interfaces/controllers/payment/payment.controller.ts
import { CreatePayment } from '@/application/use-cases/payment/create-payment.use-case'
import { GetPaymentsByBooking } from '@/application/use-cases/payment/get-payments-by-booking.use-case'
import { ProcessRefunds } from '@/application/use-cases/payment/process-refunds.use-case' // NUEVO

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
import { ProcessRefundDto } from './dto/process-refund.dto'; 

@ApiTags('Payments')
@Controller('payment')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePayment,
    private readonly getPaymentsByBookingUseCase: GetPaymentsByBooking,
    private readonly processRefundsUseCase: ProcessRefunds,
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

  @ApiOperation({ summary: 'Procesar reembolso de un pago' })
  @ApiBody({ type: ProcessRefundDto })
  @Post('refund')
  async processRefund(@Body() dto: ProcessRefundDto) {
    return this.processRefundsUseCase.execute(dto.paymentId);
  }
}