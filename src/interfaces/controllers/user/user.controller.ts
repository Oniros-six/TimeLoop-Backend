import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Patch,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUser } from '@/application/use-cases/user/create.use-case';
import { FindUser } from '@/application/use-cases/user/find.use-case';
import { FindAllUsers } from '@/application/use-cases/user/find-all.use-case';
import { UpdateUser } from '@/application/use-cases/user/update.use-case';
import { SuspendUser } from '@/application/use-cases/user/suspend.use-case';
import { ReinstateUser } from '@/application/use-cases/user/reinstate.use-case';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StateUserDto } from './dto/state-user.dto';

// Auth guards and decorators
import { AuthGuard } from '@/infrastructure/auth/auth.guard';
import { RolesGuard } from '@/infrastructure/auth/roles.guard';
import { Roles } from '@/infrastructure/auth/roles.decorator';

@ApiTags('Users')
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUser,
    private readonly findUserUseCase: FindUser,
    private readonly findAllUsersUseCase: FindAllUsers,
    private readonly updateUserUseCase: UpdateUser,
    private readonly suspendUserUseCase: SuspendUser,
    private readonly reinstateUserUseCase: ReinstateUser,
  ) { }
  //TODO Cada usuario deberia solo poder modificar y eliminar sus propios datos (mas alla de la logica de frontend que impide que un usuario pueda modificar o eliminar datos que no le pertenecen)

  //*==================================== CREATE USER ====================================
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const res = await this.createUserUseCase.execute(dto);
    const { password, role, active, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  //*==================================== FIND ====================================
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const res = await this.findUserUseCase.execute(id);

    if (!res.data) {
      return { message: 'Usuario no encontrado', statusCode: 404, data: null };
    }

    const { password, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data,
    };
  }

  //*==================================== FIND ALL ====================================
  @ApiOperation({
    summary: 'Obtener todos los usuarios de un comercio en base a su ID',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  async findAll(@Query('commerceId', ParseIntPipe) commerceId: number) {
    const res = await this.findAllUsersUseCase.execute(commerceId);

    const safeData =
      res.data?.map(({ password, ...rest }) => rest) ?? [];

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: safeData,
    };
  }

  //*==================================== UPDATE ====================================
  @ApiOperation({ summary: 'Actualizar la información de un usuario' })
  @ApiParam({
    name: 'userId',
    required: true,
    type: Number,
    description: 'ID del usuario',
  })
  @ApiBody({ type: UpdateUserDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put('/:userId')
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    const res = await this.updateUserUseCase.execute(userId, dto);
    const { password, ...data } = res.data;
    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  //*==================================== SUSPEND ====================================
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Suspender la actividad de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('suspend')
  async suspend(@Query() dto: StateUserDto) {
    const res = await this.suspendUserUseCase.execute(dto);
    const { password, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  //*==================================== REINSTATE ====================================
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Reanudar la actividad de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('reinstate')
  async reinstate(@Query() dto: StateUserDto) {
    const res = await this.reinstateUserUseCase.execute(dto);
    const { password, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }
}
