import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { BOOKING_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { IBookingRepository } from '@/domain/repositories/booking.repository';

@Injectable()
export class GetPaymentsByBooking {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,

        @Inject(BOOKING_REPOSITORY)
        private readonly bookingRepository: IBookingRepository,
    ) { }

    async execute(bookingId: number) {
        //* Confirmamos la existenccia del booking
        const booking = await this.bookingRepository.findOne({
            id: bookingId
        });

        if (!booking) {
            return {
                message: 'Reserva no encontrada',
                statusCode: HttpStatus.NOT_FOUND,
            };
        }

        const previousPayments = await this.paymentRepository.findByBookingId(booking.id)

        return {
            message: 'Pagos encontrados con exito',
            statusCode: HttpStatus.OK,
            data: previousPayments,
        };
    }
}