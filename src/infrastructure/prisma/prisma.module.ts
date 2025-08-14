import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaCustomerRepository } from './repositories/customer.repository';
import { PrismaCommerceRepository } from './repositories/commerce.repository';
import { PrismaActivityLogRepository } from './repositories/activityLog.repository';
import { PrismaServicesRepository } from './repositories/services.repository';
import { PrismaBookingRepository } from './repositories/booking.repository';

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
  ],
  exports: [
    'ICustomerRepository',
    'ICommerceRepository',
    'IActivityLogRepository',
    'IServicesRepository',
    'IBookingRepository',
  ],
})
export class PrismaModule {}
