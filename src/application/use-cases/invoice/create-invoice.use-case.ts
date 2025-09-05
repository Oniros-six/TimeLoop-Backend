import { BOOKING_HISTORY_REPOSITORY, COMMERCE_REPOSITORY, INVOICE_REPOSITORY } from '@/application/providers';
import { EntityType } from '@/domain/dbEnums/Activity-log.enum';
import { Invoice } from '@/domain/entities/invoice.entity';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { IInvoiceRepository } from '@/domain/repositories/invoice.repository';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { ConfigService } from '@nestjs/config';
import { calculateFee } from '@/domain/value-objects/invoice/helper';

@Injectable()
export class CreateInvoice {
    constructor(
        @Inject(COMMERCE_REPOSITORY)
        private readonly commerceRepository: ICommerceRepository,

        @Inject(BOOKING_HISTORY_REPOSITORY)
        private readonly bookingHistoryRepository: IBookingHistoryRepository,

        @Inject(INVOICE_REPOSITORY)
        private readonly invoiceRepository: IInvoiceRepository,

        private readonly activityLogService: ActivityLogService,
        private readonly configService: ConfigService,
    ) { }

    async execute() {
        //* Obtener todos los comercios activos
        const commerces = await this.commerceRepository.findAllActive();

        if (!commerces || commerces.length === 0) {
            return {
                message: 'No hay comercios activos registrados',
                statusCode: HttpStatus.NOT_FOUND
            };
        }

        //* Periodo: mes pasado
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        //* Configuración de fees e ingresos
        const highFeePercentage = this.configService.get<number>('HIGH_FEE_PERCENTAGE', 0.01);
        const lowFeePercentage = this.configService.get<number>('LOW_FEE_PERCENTAGE', 0.005);
        const lowIncome = this.configService.get<number>('LOW_INCOME', 50000);
        const highIncome = this.configService.get<number>('HIGH_INCOME', 200000);

        const results: Invoice[] = [];

        for (const commerce of commerces) {
            try {
                //* Obtener historial de reservas
                const historyFound = await this.bookingHistoryRepository.findByDatesAndCommerce({
                    commerceId: commerce.id,
                    startDate: monthStart,
                    endDate: monthEnd,
                });


                if (!historyFound || historyFound.length === 0) {
                    //* Si no hay historial para facturar, lo salteamos
                    continue;
                }

                //* Totales
                const totalBookings = historyFound.length;
                const totalCanceled = historyFound.filter(h => h.status === BookingStatus.CANCELED).length;
                const completedBookings = historyFound.filter(h => h.status === BookingStatus.COMPLETED);
                const totalIncome = completedBookings.reduce((total, b) => total + b.priceAtBooking, 0);

                //* Fee aplicado
                const appliedFee = calculateFee(totalIncome, lowIncome, highIncome, lowFeePercentage, highFeePercentage);
                const serviceFee = appliedFee * totalIncome;

                //* Crear entidad Invoice
                const invoice = Invoice.create({
                    commerceId: commerce.id,
                    periodStart: monthStart,
                    periodEnd: monthEnd,
                    totalBookings,
                    totalCanceled,
                    totalIncome,
                    feePercentage: appliedFee,
                    serviceFee,
                });

                //* Persistir en repositorio
                const result = await this.invoiceRepository.createInvoice(invoice);


                results.push(result);

                //* Log de actividad
                await this.activityLogService.created({
                    entityType: EntityType.INVOICE,
                    entityId: result.id,
                    userId: null,
                    commerceId: result.commerceId,
                    customerId: null,
                    detail: `Factura generada con éxito para el comercio con id: ${result.commerceId}`,
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error desconocido';
                console.error(`Error procesando comercio ${commerce.id}: ${message}`);
            }
        }

        if (results.length === 0) {
            return {
                message: 'No se encontró historial de facturación para comercios activos.',
                statusCode: HttpStatus.NOT_FOUND
            };
        }

        return {
            message: 'Facturas generadas exitosamente',
            statusCode: HttpStatus.OK,
            data: results,
        };
    }
}
