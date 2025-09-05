import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaCustomerRepository } from './repositories/customer.repository';
import { PrismaCommerceRepository } from './repositories/commerce.repository';
import { PrismaActivityLogRepository } from './repositories/activityLog.repository';
import { PrismaServicesRepository } from './repositories/services.repository';
import { PrismaBookingRepository } from './repositories/booking.repository';
import { PrismaUserRepository } from './repositories/user.repository';
import { PrismaUserConfigRepository } from './repositories/userConfig.repository';
import { PrismaCommerceConfigRepository } from './repositories/commerceConfig.repository';
import { PrismaUserWorkingPatternRepository } from './repositories/userWorkingPattern.repository';
import { PrismaCommerceWorkingPatternRepository } from './repositories/commerceWorkingPattern.repository';
import { PrismaUserWorkingOverrideRepository } from './repositories/userWorkingOverride.repository';
import { PrismaCommerceWorkingOverrideRepository } from './repositories/commerceWorkingOverride.repository';
import { PrismaReminderRepository } from './repositories/reminder.repository';
import { PrismaBookingHistoryRepository } from './repositories/bookingHistory.repository';
import { PrismaInvoiceRepository } from './repositories/invoice.repository';
import { PrismaPaymentRepository } from './repositories/payment.repository';
import { PrismaMercadoPagoRepository } from './repositories/mercadoPago.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: 'ICustomerRepository',
      useClass: PrismaCustomerRepository,
    },
    {
      provide: 'ICommerceRepository',
      useClass: PrismaCommerceRepository,
    },
    {
      provide: 'IActivityLogRepository',
      useClass: PrismaActivityLogRepository,
    },
    {
      provide: 'IServicesRepository',
      useClass: PrismaServicesRepository,
    },
    {
      provide: 'IBookingRepository',
      useClass: PrismaBookingRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IUserConfigRepository',
      useClass: PrismaUserConfigRepository,
    },
    {
      provide: 'ICommerceConfigRepository',
      useClass: PrismaCommerceConfigRepository,
    },
    {
      provide: 'IUserWorkingPatternRepository',
      useClass: PrismaUserWorkingPatternRepository,
    },
    {
      provide: 'ICommerceWorkingPatternRepository',
      useClass: PrismaCommerceWorkingPatternRepository,
    },
    {
      provide: 'IUserWorkingOverrideRepository',
      useClass: PrismaUserWorkingOverrideRepository,
    },
    {
      provide: 'ICommerceWorkingOverrideRepository',
      useClass: PrismaCommerceWorkingOverrideRepository,
    },
    {
      provide: 'IReminderRepository',
      useClass: PrismaReminderRepository,
    },
    {
      provide: 'IBookingHistoryRepository',
      useClass: PrismaBookingHistoryRepository,
    },
    {
      provide: 'IInvoiceRepository',
      useClass: PrismaInvoiceRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PrismaPaymentRepository,
    },
    {
      provide: 'IMercadoPagoRepository',
      useClass: PrismaMercadoPagoRepository,
    },
  ],

  exports: [
    PrismaService,
    'ICustomerRepository',
    'ICommerceRepository',
    'IActivityLogRepository',
    'IServicesRepository',
    'IBookingRepository',
    'IUserRepository',
    'IUserConfigRepository',
    'ICommerceConfigRepository',
    'IUserWorkingPatternRepository',
    'ICommerceWorkingPatternRepository',
    'IUserWorkingOverrideRepository',
    'ICommerceWorkingOverrideRepository',
    'IReminderRepository',
    'IBookingHistoryRepository',
    'IInvoiceRepository',
    'IPaymentRepository',
    'IMercadoPagoRepository',
  ],
})
export class PrismaModule {}
