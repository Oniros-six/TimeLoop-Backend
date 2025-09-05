import { INVOICE_REPOSITORY } from '@/application/providers';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IInvoiceRepository } from '@/domain/repositories/invoice.repository';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class UpdatePaid {
    constructor(
        @Inject(INVOICE_REPOSITORY)
        private readonly invoiceRepository: IInvoiceRepository,

        private readonly activityLogService: ActivityLogService,
    ) { }

    async execute(invoiceId: number) {
        //* Confirmamos la existencia del invoice
        const invoiceFound = await this.invoiceRepository.findById(invoiceId);

        if (!invoiceFound) {
            throw new HttpException('Factura no encontrada.', HttpStatus.NOT_FOUND);
        }

        //* Actualizar invoice
        const result = await this.invoiceRepository.updateStatus({ invoiceId: invoiceId, status: InvoiceStatus.PAID });

        if (result === null) {
            throw new HttpException(
                'Error al actualizar la factura, intente de nuevo en unos minutos.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        await this.activityLogService.updated({
            entityType: EntityType.INVOICE,
            entityId: result.id,
            userId: null,
            commerceId: result.commerceId,
            customerId: null,
            detail: `Factura actualizada con exito para el comercio con id: ${result.commerceId}, estado: ${InvoiceStatus.PAID}`,
        });

        return {
            message: 'Factura actualizada con éxito',
            statusCode: HttpStatus.OK,
            data: result,
        };
    } catch(err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error(message);
        throw new HttpException(
            'Algo salió mal al actualizar la factura, inténtelo de nuevo más tarde.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
