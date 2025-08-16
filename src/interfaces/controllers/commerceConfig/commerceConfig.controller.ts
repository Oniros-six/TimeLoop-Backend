import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateCommerceConfig } from '@/application/use-cases/commerceConfig/create.use-case';
import { UpdateCommerceConfig } from '@/application/use-cases/commerceConfig/update.use-case';
import { FindCommerceConfig } from '@/application/use-cases/commerceConfig/find.use-case';
import { CreateCommerceConfigDto } from './dto/create-commerceConfig.dto';
import { UpdateCommerceConfigDto } from './dto/update-commerceConfig.dto';

@ApiTags('Commerce Config')
@Controller('commerce-config')
export class CommerceConfigController {
  constructor(
    private readonly createCommerceConfigUseCase: CreateCommerceConfig,
    private readonly updateCommerceConfigUseCase: UpdateCommerceConfig,
    private readonly findCommerceConfigUseCase: FindCommerceConfig,
  ) {}

  // Create a commerce
  @ApiOperation({ summary: 'Crear la configuración de un comercio' })
  @ApiBody({ type: CreateCommerceConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCommerceConfigDto) {
    return this.createCommerceConfigUseCase.execute(dto.commerceId, dto);
  }

  // Get a commerce
  @ApiOperation({ summary: 'Obtener la configuración de un comercio' })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':commerceId')
  find(@Param('commerceId', ParseIntPipe) commerceId: number) {
    return this.findCommerceConfigUseCase.execute(commerceId);
  }

  // Update a commerce
  @ApiOperation({ summary: 'Actualizar la información de un comercio' })
  @ApiBody({ type: UpdateCommerceConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put()
  update(@Body() dto: UpdateCommerceConfigDto) {
    return this.updateCommerceConfigUseCase.execute(dto.commerceId, dto);
  }
}
