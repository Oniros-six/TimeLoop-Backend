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

import { CreateUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/create.use-case';
import { UpdateUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/update.use-case';
import { FindAllUserWorkingPattern } from '@/application/use-cases/userWorkingPattern/findAll.use-case';

import { CreateUserPatternDto } from './dto/create-userPattern.dto';
import { UpdateUserPatternDto } from './dto/update-userPattern.dto';

import { AuthGuard } from '@/infrastructure/auth/auth.guard';

@ApiTags('User Working Pattern')
@UseGuards(AuthGuard)
@Controller('user-working-pattern')
export class UserWorkingPatternController {
  constructor(
    private readonly createUserWorkingPatternUseCase: CreateUserWorkingPattern,
    private readonly updateUserWorkingPatternUseCase: UpdateUserWorkingPattern,
    private readonly findAllUserWorkingPatternUseCase: FindAllUserWorkingPattern,
  ) { }

  //*==================================== CREATE ====================================

  @ApiOperation({ summary: 'Crear un patrón de trabajo para un usuario' })
  @ApiBody({ type: CreateUserPatternDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateUserPatternDto) {
    return this.createUserWorkingPatternUseCase.execute(dto);
  }

  //*==================================== FIND ALL ====================================

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Obtener todos los patrones de trabajo de un usuario',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':userId')
  findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.findAllUserWorkingPatternUseCase.execute(userId);
  }

  //*==================================== UPDATE ====================================

  @ApiOperation({ summary: 'Actualizar patrones de trabajo de un usuario (lote)' })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiBody({ type: [UpdateUserPatternDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':userId')
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserPatternDto[],
  ) {
    return this.updateUserWorkingPatternUseCase.execute(userId, dto);
  }
}
