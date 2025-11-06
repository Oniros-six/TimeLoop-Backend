import {
  Controller,
  Get,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { FindByCommerce } from '@/application/use-cases/bookingHistory/find-by-commerce.use-case';
import { FindByUser } from '@/application/use-cases/bookingHistory/find-by-user.use-case';
import { FindByDates } from '@/application/use-cases/bookingHistory/find-by-dates.use-case';
import { FindByCommerceDate } from '@/application/use-cases/bookingHistory/find-by-date-commerce.use-case';
import { FindByUserDate } from '@/application/use-cases/bookingHistory/find-by-date-user.use-case';
import { FindByDateUserDto } from './dto/find-by-date-user.dto';
import { FindByDateCommerceDto } from './dto/find-by-date-commerce.dto';
import { FindByDateDto } from './dto/find-by-date.dto';

import { AuthGuard } from '@/infrastructure/auth/auth.guard';

@ApiTags('Booking History')
@UseGuards(AuthGuard)
@Controller('booking-history')
export class BookingHistoryController {
  constructor(
    private readonly findByCommerceUseCase: FindByCommerce,
    private readonly findByUserUseCase: FindByUser,
    private readonly findByDatesUseCase: FindByDates,
    private readonly findByCommerceDateUseCase: FindByCommerceDate,
    private readonly findByUserDateUseCase: FindByUserDate,
  ) { }

  //*==================================== FIND BY COMMERCE ====================================
  @ApiOperation({ summary: 'Obtener el historial de un comercio' })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':commerceId')
  findByCommerce(@Param('commerceId', ParseIntPipe) commerceId: number) {
    return this.findByCommerceUseCase.execute(commerceId);
  }

  //*==================================== FIND BY USER ========================================
  @ApiOperation({ summary: 'Obtener el historial de un usuario' })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.findByUserUseCase.execute(userId);
  }

  //*==================================== FIND BY USER DATE ======================================
  @ApiOperation({
    summary: 'Obtener el historial de un usuario filtrado por fechas',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  findByUserDate(@Query() dto: FindByDateUserDto) {
    return this.findByUserDateUseCase.execute(dto);
  }

  //*==================================== FIND BY COMMERCE DATE ===================================
  @ApiOperation({
    summary: 'Obtener el historial de un comercio filtrado por fechas',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'commerceId', required: true, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  findByCommerceDate(@Query() dto: FindByDateCommerceDto) {
    return this.findByCommerceDateUseCase.execute(dto);
  }

  //*==================================== FIND BY DATE =============================================
  @ApiOperation({ summary: 'Obtener el historial general filtrado por fechas' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  findByDate(@Query() dto: FindByDateDto) {
    return this.findByDatesUseCase.execute(dto);
  }
}
