import { FindAllByCommerce } from '@/application/use-cases/invoice/find-all-commerce.use-case';
import { FindAllByCommerceDate } from '@/application/use-cases/invoice/find-all-date-commerce.use-case';
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindByCommerceDateDto } from './dto/find-by-date.dto';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoiceController {
    constructor(
        private readonly findAllByCommerce: FindAllByCommerce,
        private readonly findAllByCommerceDate: FindAllByCommerceDate,
    ) { }

    @ApiOperation({ summary: 'Obtener todas las facturas de un comercio' })
    @ApiParam({
        name: 'commerceId',
        type: Number,
        required: true,
        description: 'ID del comercio',
    })
    @Get(':commerceId')
    findAll(@Param('commerceId', ParseIntPipe) commerceId: number) {
        return this.findAllByCommerce.execute(commerceId);
    }

    @ApiOperation({ summary: 'Obtener facturas de un comercio por rango de fechas' })
    @ApiParam({
        name: 'commerceId',
        type: Number,
        required: true,
        description: 'ID del comercio',
    })
    @Get(':commerceId/by-date')
    findAllByDate(
        @Param('commerceId', ParseIntPipe) commerceId: number,
        @Query() dto: FindByCommerceDateDto,
    ) {
        return this.findAllByCommerceDate.execute(commerceId, dto);
    }

}


