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

import { CreateUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/create.use-case';
import { UpdateUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/update.use-case';
import { FindAllUserWorkingOverride } from '@/application/use-cases/userWorkingOverride/findAll.use-case';

import { CreateUserOverrideDto } from './dto/create-userOverride.dto';
import { UpdateUserOverrideDto } from './dto/update-userOverride.dto';

@ApiTags('User Working Override')
@Controller('user-working-override')
export class UserWorkingOverrideController {
  constructor(
    private readonly createUserWorkingOverrideUseCase: CreateUserWorkingOverride,
    private readonly updateUserWorkingOverrideUseCase: UpdateUserWorkingOverride,
    private readonly findAllUserWorkingOverrideUseCase: FindAllUserWorkingOverride,
  ) {}

  @ApiOperation({
    summary:
      'Crear un patrón de trabajo especifico en una fecha para un usuario',
  })
  @ApiBody({ type: CreateUserOverrideDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateUserOverrideDto) {
    return this.createUserWorkingOverrideUseCase.execute(dto);
  }

  @ApiOperation({
    summary:
      'Obtener todos los patrones de trabajo especificos en una fecha de un usuario',
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
    return this.findAllUserWorkingOverrideUseCase.execute(userId);
  }

  @ApiOperation({ summary: 'Actualizar un override de un usuario' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del override',
  })
  @ApiBody({ type: UpdateUserOverrideDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserOverrideDto,
  ) {
    return this.updateUserWorkingOverrideUseCase.execute(id, dto);
  }
}
