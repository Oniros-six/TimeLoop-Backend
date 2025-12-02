import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UsePipes,
  ValidationPipe,
  Query,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBooking } from '@/application/use-cases/booking/create.use-case';
import { UpdateBooking } from '@/application/use-cases/booking/update.use-case';
import { FindAllByCommerce } from '@/application/use-cases/booking/find-all-by-commerce.use-case';
import { FindAllByUserAndDate } from '@/application/use-cases/booking/find-all-by-date-user.use-case';
import { CancelBooking } from '@/application/use-cases/booking/cancel.use-case';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FindByCommerceDto } from './dto/find-by-commerce.dto';
import { FindByDateAndUserDto } from './dto/find-by-date-user.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { FindByUserDto } from './dto/find-by-user.dto';
import { FindAllByUser } from '@/application/use-cases/booking/find-all-by-user.use-case';

@ApiTags('Bookings')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBooking,
    private readonly updateBookingUseCase: UpdateBooking,
    private readonly findAllByUserAndDateUseCase: FindAllByUserAndDate,
    private readonly findAllByCommerceUseCase: FindAllByCommerce,
    private readonly findAllByUserUseCase: FindAllByUser,
    private readonly cancelBookingUseCase: CancelBooking,
  ) { }

  //*==================================== CREATE ====================================
  @ApiOperation({ summary: 'Guardar una reserva' })
  @ApiBody({ type: CreateBookingDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.createBookingUseCase.execute(dto);
  }

  //*==================================== FIND ALL BY COMMERCE ====================================
  @ApiOperation({
    summary: 'Obtener todas las reservas de un comercio, con base en su ID',
  })
  @ApiQuery({ name: 'commerceId', required: true, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('commerce')
  findAll(@Query() dto: FindByCommerceDto) {
    return this.findAllByCommerceUseCase.execute(dto);
  }

  //*==================================== FIND BY USER ====================================
  @ApiOperation({
    summary: 'Obtener todas las reservas de un usuario, con base en su ID',
  })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('user')
  findByUser(@Query() dto: FindByUserDto) {
    return this.findAllByUserUseCase.execute(dto);
  }

  //*==================================== FIND ALL BY DATE AND COMMERCE ON ANY STATE ====================================
  @ApiOperation({
    summary:
      'Obtener todas las reservas de un comercio, sin importar su estado, con base en el ID del comercio',
  })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'commerceId', required: true, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('slots')
  findAllByDateAndCommerce(@Query() dto: FindByDateAndUserDto) {
    return this.findAllByUserAndDateUseCase.execute(dto);
  }

  //*==================================== CANCEL ====================================
  @ApiOperation({ summary: 'Actualizar el estado de una reserva a cancelado' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID de la reserva',
  })
  @ApiBody({ type: CancelBookingDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch(':id')
  cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.cancelBookingUseCase.execute(id, dto);
  }

  //*==================================== UPDATE ====================================
  @ApiBody({ type: UpdateBookingDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookingDto) {
    return this.updateBookingUseCase.execute(id, dto);
  }
}
