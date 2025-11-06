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

import { CreateCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/create.use-case';
import { UpdateCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/update.use-case';
import { FindAllCommerceWorkingOverride } from '@/application/use-cases/commerceWorkingOverride/findAll.use-case';

import { CreateCommerceOverrideDto } from './dto/create-commerceOverride.dto';
import { UpdateCommerceOverrideDto } from './dto/update-commerceOverride.dto';

@ApiTags('Commerce Working Override')
@Controller('commerce-working-override')
export class CommerceWorkingOverrideController {
  constructor(
    private readonly createCommerceWorkingOverrideUseCase: CreateCommerceWorkingOverride,
    private readonly updateCommerceWorkingOverrideUseCase: UpdateCommerceWorkingOverride,
    private readonly findAllCommerceWorkingOverrideUseCase: FindAllCommerceWorkingOverride,
  ) { }

  //*==================================== CREATE COMMERCE WORKING OVERRIDE ====================================
  @ApiOperation({
    summary:
      'Crear un patrón de trabajo especifico en una fecha para un comercio',
  })
  @ApiBody({ type: CreateCommerceOverrideDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCommerceOverrideDto) {
    return this.createCommerceWorkingOverrideUseCase.execute(dto);
  }

  //*==================================== FIND ALL ====================================
  @ApiOperation({
    summary:
      'Obtener todos los patrones de trabajo especificos en una fecha para un comercio',
  })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':commerceId')
  findAll(@Param('commerceId', ParseIntPipe) commerceId: number) {
    return this.findAllCommerceWorkingOverrideUseCase.execute(commerceId);
  }

  //*==================================== UPDATE ====================================
  @ApiOperation({ summary: 'Actualizar un override de un comercio' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del override',
  })
  @ApiBody({ type: UpdateCommerceOverrideDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommerceOverrideDto,
  ) {
    return this.updateCommerceWorkingOverrideUseCase.execute(id, dto);
  }
}
