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
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateCommerceConfig } from '@/application/use-cases/commerceConfig/create.use-case';
import { UpdateCommerceConfig } from '@/application/use-cases/commerceConfig/update.use-case';
import { FindCommerceConfig } from '@/application/use-cases/commerceConfig/find.use-case';
import { CreateCommerceConfigDto } from './dto/create-commerceConfig.dto';
import { UpdateCommerceConfigDto } from './dto/update-commerceConfig.dto';

import { AuthGuard } from '@/infrastructure/auth/auth.guard';
import { RolesGuard } from '@/infrastructure/auth/roles.guard';
import { Roles } from '@/infrastructure/auth/roles.decorator';
import { Public } from '@/infrastructure/auth/public.decorator';

@ApiTags('Commerce Config')
@UseGuards(AuthGuard)
@Controller('commerce-config')
export class CommerceConfigController {
  constructor(
    private readonly createCommerceConfigUseCase: CreateCommerceConfig,
    private readonly updateCommerceConfigUseCase: UpdateCommerceConfig,
    private readonly findCommerceConfigUseCase: FindCommerceConfig,
  ) { }

  //*==================================== CREATE COMMERCE CONFIG ====================================
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Crear la configuración de un comercio' })
  @ApiBody({ type: CreateCommerceConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCommerceConfigDto) {
    return this.createCommerceConfigUseCase.execute(dto.commerceId, dto);
  }

  //*==================================== FIND ====================================
  @ApiOperation({ summary: 'Obtener la configuración de un comercio' })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @Public()
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':commerceId')
  find(@Param('commerceId', ParseIntPipe) commerceId: number) {
    return this.findCommerceConfigUseCase.execute(commerceId);
  }

  //*==================================== UPDATE ====================================
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar la configuración de un comercio' })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    description: 'ID del comercio',
  })
  @ApiBody({ type: UpdateCommerceConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':commerceId')
  update(
    @Param('commerceId', ParseIntPipe) commerceId: number,
    @Body() dto: UpdateCommerceConfigDto,
  ) {
    return this.updateCommerceConfigUseCase.execute(commerceId, dto);
  }
}
