import { COMMERCE_REPOSITORY, INVOICE_REPOSITORY } from '@/application/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IInvoiceRepository } from '@/domain/repositories/invoice.repository';

@Injectable()
export class FindAllByCommerce {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        @Inject(INVOICE_REPOSITORY)
        private readonly invoiceRepository: IInvoiceRepository,
    ) { }

    async execute(commerceId: number) {
        //* Confirmamos la existencia del comercio
        const commerceFound = await this.commerceRepository.findCommerce({
            commerceId: commerceId,
        });
        if (!commerceFound) {
            throw new HttpException('El comercio no existe.', HttpStatus.NOT_FOUND);
        }
        const invoices = await this.invoiceRepository.findAllByCommerce(
            commerceId
        );
         
        if (!invoices || invoices.length == 0) {
            return {
                message: 'No hay facturas asociadas a este comercio.',
                statusCode: HttpStatus.OK,
                data: invoices,
            };
        }

        return {
            message: 'Facturas obtenidas con éxito',
            statusCode: HttpStatus.OK,
            data: invoices,
        };
    }
}
