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
  Query,
  Delete,
} from '@nestjs/common';

import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

// Use cases
import { CreateService } from '@/application/use-cases/services/create.use-case';
import { FindService } from '@/application/use-cases/services/find.use-case';
import { UpdateService } from '@/application/use-cases/services/update.use-case';
import { DeleteService } from '@/application/use-cases/services/delete.use-case';
import { FindAllServices } from '@/application/use-cases/services/find-all.use-case';

// DTOs
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { DeleteServiceDto } from './dto/delete-service.dto';

@ApiTags('Services')
@Controller('service')
export class ServicesController {
  constructor(
    private readonly createServiceUseCase: CreateService,
    private readonly findServiceUseCase: FindService,
    private readonly updateServiceUseCase: UpdateService,
    private readonly deleteServiceUseCase: DeleteService,
    private readonly findAllServicesUseCase: FindAllServices,
  ) {}

  // Create a Service
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiBody({ type: CreateServiceDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.createServiceUseCase.execute(dto);
  }

  // Get a Service
  @ApiOperation({ summary: 'Obtener un servicio por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del servicio',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  async find(
    @Param('id', ParseIntPipe) id: number,
    @Query('commerceId', ParseIntPipe) commerceId: number,
  ) {
    const res = await this.findServiceUseCase.execute(id, commerceId);

    if (!res.data) {
      return { message: 'Servicio no encontrado', statusCode: 404, data: null };
    }

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: res.data,
    };
  }

  // Get all Services
  @ApiOperation({ summary: 'Obtener todos los servicios de un comercio' })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  async findAll(@Query('commerceId', ParseIntPipe) commerceId: number) {
    const res = await this.findAllServicesUseCase.execute(commerceId);
    return {
      message: res.message,
      statusCode: res.statusCode,
      data: res.data,
    };
  }

  // Update a Service
  @ApiOperation({ summary: 'Actualizar la información de un Service' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID del Service',
  })
  @ApiBody({ type: UpdateServiceDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.updateServiceUseCase.execute(id, dto);
  }

  // Suspend a Service
  @ApiOperation({ summary: 'Eliminar un servicio' })
  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del Service',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Delete()
  delete(@Query() dto: DeleteServiceDto) {
    return this.deleteServiceUseCase.execute(dto.id, dto.commerceId);
  }
}
