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

import { CreateCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/create.use-case';
import { UpdateCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/update.use-case';
import { FindAllCommerceWorkingPattern } from '@/application/use-cases/commerceWorkingPattern/findAll.use-case';

import { CreateCommercePatternDto } from './dto/create-commercePattern.dto';
import { UpdateCommercePatternDto } from './dto/update-commercePattern.dto';

import { Roles } from '@/infrastructure/auth/roles.decorator';
import { RolesGuard } from '@/infrastructure/auth/roles.guard';
import { AuthGuard } from '@/infrastructure/auth/auth.guard';

@ApiTags('Commerce Working Pattern')
@UseGuards(AuthGuard)
@Controller('commerce-working-pattern')
export class CommerceWorkingPatternController {
  constructor(
    private readonly createCommerceWorkingPatternUseCase: CreateCommerceWorkingPattern,
    private readonly updateCommerceWorkingPatternUseCase: UpdateCommerceWorkingPattern,
    private readonly findAllCommerceWorkingPatternUseCase: FindAllCommerceWorkingPattern,
  ) { }

  //*==================================== CREATE ====================================

  @ApiOperation({ summary: 'Crear un patrón de trabajo para un comercio' })
  @ApiBody({ type: CreateCommercePatternDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCommercePatternDto) {
    return this.createCommerceWorkingPatternUseCase.execute(dto);
  }

  //*==================================== FIND ALL ====================================

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Obtener todos los patrones de trabajo de un comercio',
  })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':commerceId')
  findAll(@Param('commerceId', ParseIntPipe) commerceId: number) {
    return this.findAllCommerceWorkingPatternUseCase.execute(commerceId);
  }

  //*==================================== UPDATE ====================================

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar patrones de trabajo de un comercio (lote)' })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @ApiBody({ type: [UpdateCommercePatternDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':commerceId')
  update(
    @Param('commerceId', ParseIntPipe) commerceId: number,
    @Body() dto: UpdateCommercePatternDto[],
  ) {
    return this.updateCommerceWorkingPatternUseCase.execute(commerceId, dto);
  }
}
