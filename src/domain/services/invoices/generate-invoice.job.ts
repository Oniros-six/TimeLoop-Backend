import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateInvoice } from '@/application/use-cases/invoice/create-invoice.use-case';

@Injectable()
export class InvoiceCron {
    private readonly logger = new Logger(InvoiceCron.name);

    constructor(private readonly generateInvoice: CreateInvoice) { }

    // Se ejecuta cada 1° de mes a las 00:00 AM
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleCron() {
        this.logger.log('Iniciando generación de facturas...');
        try {
            const res = await this.generateInvoice.execute();
            this.logger.log(res.message);
        } catch (error) {
            this.logger.error('Error generando facturas', error.stack);
        }
    }
}
