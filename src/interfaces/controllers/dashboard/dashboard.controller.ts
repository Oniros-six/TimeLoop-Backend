import {
    Controller,
    Get,
    Param,
    UsePipes,
    ValidationPipe,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetDashboardInfo } from '@/application/use-cases/dashboard/get-info.use-case';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly getDashboardInfoUseCase: GetDashboardInfo,
    ) { }
    // Get information for dashboard
    @ApiOperation({ summary: 'Obtener información del panel de control' })
    @ApiParam({
        name: 'id',
        type: Number,
        required: true,
        description: 'ID del usuario admin del comercio',
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    @Get(':id')
    find(@Param('id', ParseIntPipe) id: number) {
        return this.getDashboardInfoUseCase.execute(id);
    }
}
