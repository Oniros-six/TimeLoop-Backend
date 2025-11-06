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

import { CreateUserConfig } from '@/application/use-cases/userConfig/create.use-case';
import { UpdateUserConfig } from '@/application/use-cases/userConfig/update.use-case';
import { FindUserConfig } from '@/application/use-cases/userConfig/find.use-case';
import { CreateUserConfigDto } from './dto/create-userConfig.dto';
import { UpdateUserConfigDto } from './dto/update-userConfig.dto';
import { AuthGuard } from '@/infrastructure/auth/auth.guard';

@ApiTags('User Config')
@UseGuards(AuthGuard)
@Controller('user-config')
export class UserConfigController {
  constructor(
    private readonly createUserConfigUseCase: CreateUserConfig,
    private readonly updateUserConfigUseCase: UpdateUserConfig,
    private readonly findUserConfigUseCase: FindUserConfig,
  ) { }
  //TODO Cada usuario deberia solo poder modificar y eliminar sus propias configuraciones (mas alla de la logica de frontend que impide que un usuario pueda modificar o eliminar una configuración que no le pertenece)

  //*==================================== CREATE USER CONFIG ====================================
  @ApiOperation({ summary: 'Crear la configuración de un usuario' })
  @ApiBody({ type: CreateUserConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateUserConfigDto) {
    return this.createUserConfigUseCase.execute(dto.userId, dto);
  }

  //*==================================== FIND ====================================
  @ApiOperation({ summary: 'Obtener la configuración de un usuario' })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':userId')
  find(@Param('userId', ParseIntPipe) userId: number) {
    return this.findUserConfigUseCase.execute(userId);
  }

  //*==================================== UPDATE ====================================
  @ApiOperation({ summary: 'Actualizar la configuración de un usuario' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID del usuario',
  })
  @ApiBody({ type: UpdateUserConfigDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put(':userId')
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserConfigDto,
  ) {
    return this.updateUserConfigUseCase.execute(userId, dto);
  }
}
