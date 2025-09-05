import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateCustomer } from '@/application/use-cases/customer/create.use-case';
import { FindCustomer } from '@/application/use-cases/customer/find.use-case';
import { FindAllCustomers } from '@/application/use-cases/customer/find-all.use-case';
import { UpdateCustomer } from '@/application/use-cases/customer/update.use-case';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@Controller('customer')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomer,
    private readonly findCustomerUseCase: FindCustomer,
    private readonly findAllCustomersUseCase: FindAllCustomers,
    private readonly updateCustomerUseCase: UpdateCustomer,
  ) {}

  // Create a client
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiBody({ type: CreateCustomerDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.createCustomerUseCase.execute(dto);
  }

  // Get all clients
  @ApiOperation({
    summary: 'Obtener todos los clientes',
  })
  @Get()
  findAll() {
    return this.findAllCustomersUseCase.execute();
  }

  // Get a client
  @ApiOperation({ summary: 'Obtener un cliente por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del cliente',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.findCustomerUseCase.execute(id);
  }

  // Update a client
  @ApiOperation({ summary: 'Actualizar la información de un cliente' })
  @ApiParam({
    name: 'customerId',
    required: true,
    type: Number,
    description: 'ID del cliente',
  })
  @ApiBody({ type: UpdateCustomerDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put('/:id')
  update(@Param('id') id: number, @Body() dto: UpdateCustomerDto) {
    return this.updateCustomerUseCase.execute(id, dto);
  }
}
