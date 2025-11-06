import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Patch,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateCommerce } from '@/application/use-cases/commerce/create.use-case';
import { FindCommerce } from '@/application/use-cases/commerce/find.use-case';
import { UpdateCommerce } from '@/application/use-cases/commerce/update.use-case';
import { SuspendCommerce } from '@/application/use-cases/commerce/suspend.use-case';
import { ReinstateCommerce } from '@/application/use-cases/commerce/reinstate.use-case';
import { UploadCommerceLogo } from '@/application/use-cases/commerce/upload-logo.use-case';

import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from '@/infrastructure/auth/auth.guard';
import { Roles } from '@/infrastructure/auth/roles.decorator';
import { RolesGuard } from '@/infrastructure/auth/roles.guard';

@ApiTags('Commerces')
@Controller('commerce')
export class CommerceController {
  constructor(
    private readonly createCommerceUseCase: CreateCommerce,
    private readonly findCommerceUseCase: FindCommerce,
    private readonly updateCommerceUseCase: UpdateCommerce,
    private readonly suspendCommerceUseCase: SuspendCommerce,
    private readonly reinstateCommerceUseCase: ReinstateCommerce,
    private readonly uploadCommerceLogoUseCase: UploadCommerceLogo
  ) { }
  //TODO Cada usuario deberia solo poder modificar y eliminar su propio comercio (mas alla de la logica de frontend que impide que un usuario pueda modificar o eliminar un comercio que no le pertenece)

  //*==================================== CREATE COMMERCE ====================================
  @ApiOperation({ summary: 'Crear un nuevo comercio' })
  @ApiBody({ type: CreateCommerceDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  create(@Body() dto: CreateCommerceDto) {
    return this.createCommerceUseCase.execute(dto);
  }

  //*==================================== FIND ====================================
  @ApiOperation({ summary: 'Obtener un commerce por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del commerce',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.findCommerceUseCase.execute(id);
  }

  //*==================================== UPDATE ====================================
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar la información de un commerce' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID del commerce',
  })
  @ApiBody({ type: UpdateCommerceDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Put('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommerceDto,
  ) {
    return this.updateCommerceUseCase.execute(id, dto);
  }

  //*==================================== SUSPEND ====================================
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Suspender la actividad de un comercio' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del commerce',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('/suspend/:id')
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.suspendCommerceUseCase.execute(id);
  }

  //*==================================== REINSTATE ====================================
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Reanudar la actividad de un comercio' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del commerce',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('/reinstate/:id')
  reinstate(@Param('id', ParseIntPipe) id: number) {
    return this.reinstateCommerceUseCase.execute(id);
  }

  //*==================================== UPLOAD LOGO ====================================
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1 * 1024 * 1024 }, // 1MB máximo
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const commerceId = req.user.commerceId;
    return this.uploadCommerceLogoUseCase.execute(commerceId, file);
  }
}
