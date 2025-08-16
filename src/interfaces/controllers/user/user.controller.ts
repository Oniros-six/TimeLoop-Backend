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
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

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
  ) {}

  // Create a user
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  // Get a user
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  find(@Query() dto: FindUserDto) {
    return this.findUserUseCase.execute(dto.userId, dto.commerceId);
  }

  // Get a all users
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
  @Get('all')
  findAll(@Query() dto: FindUserDto) {
    return this.findAllUsersUseCase.execute(dto.commerceId);
  }

  // Update a user
  @ApiOperation({ summary: 'Actualizar la información de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @ApiBody({ type: UpdateUserDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put()
  update(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('commerceId', ParseIntPipe) commerceId: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUserUseCase.execute(userId, commerceId, dto);
  }

  // Suspend a user
  @ApiOperation({ summary: 'Suspender la actividad de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('suspend')
  suspend(@Query() dto: StateUserDto) {
    return this.suspendUserUseCase.execute(dto);
  }

  // Reinstate a user
  @ApiOperation({ summary: 'Reanudar la actividad de un usuario' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID del usuario',
  })
  @ApiQuery({
    name: 'commerceId',
    type: Number,
    required: true,
    description: 'ID del comercio',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('reinstate')
  reinstate(@Query() dto: StateUserDto) {
    return this.reinstateUserUseCase.execute(dto);
  }
}
