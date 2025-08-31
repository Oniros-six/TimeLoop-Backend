import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaymentRepository } from '@/domain/repositories/payment.repository';
import { CreatePaymentDto } from '@/interfaces/controllers/payment/dto/create-payment.dto';
import { Payment as PaymentDomain } from '@/domain/entities/payment.entity';
import { BOOKING_REPOSITORY, PAYMENT_REPOSITORY } from '@/application/providers';
import { ActivityLogService } from '@/domain/services/activityLog/activity-log.service';
import { EntityType } from '@/domain/dbEnums/activity-log.constants';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus'

@Injectable()
export class ConfirmPaymentStatus {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,

        @Inject(BOOKING_REPOSITORY)
        private readonly bookingRepository: IBookingRepository,

        private readonly activityLogService: ActivityLogService,
    ) { }

    async execute(id: number) {
    }
}
