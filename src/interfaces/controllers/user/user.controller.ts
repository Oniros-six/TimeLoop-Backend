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
import { FindUserDto } from './dto/find-user.dto';
import { StateUserDto } from './dto/state-user.dto';

// // Auth guards and decorators
// import { AuthGuard } from '@/infrastructure/auth/auth.guard';
// import { RolesGuard } from '@/infrastructure/auth/roles.guard';

@ApiTags('Users')
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

  // Create a user
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

  // Get a user
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  async find(@Query() dto: FindUserDto) {
    const res = await this.findUserUseCase.execute(dto.userId);
    const { password, role, active, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  // Get a all users
  @ApiOperation({
    summary: 'Obtener todos los usuarios de un comercio en base a su ID',
  })
  @ApiParam({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('all/:commerceId')
  async findAll(@Param('commerceId', ParseIntPipe) commerceId: number) {
    const res = await this.findAllUsersUseCase.execute(commerceId);
    const safeData = res.data?.map(({ password, role, active, ...rest }) => rest) ?? [];

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: safeData,
    };
  }

  // Update a user
  @ApiOperation({ summary: 'Actualizar la información de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiBody({ type: UpdateUserDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put()
  async update(
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    const res = await this.updateUserUseCase.execute(userId, dto);
    const { password, role, active, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  // Suspend a user
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
    const { password, role, active, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }

  // Reinstate a user
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
    const { password, role, active, ...data } = res.data;

    return {
      message: res.message,
      statusCode: res.statusCode,
      data: data,
    };
  }
}
