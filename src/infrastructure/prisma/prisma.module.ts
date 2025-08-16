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
  ],
  exports: [
    'ICustomerRepository',
    'ICommerceRepository',
    'IActivityLogRepository',
    'IServicesRepository',
    'IBookingRepository',
    'IUserRepository',
    'IUserConfigRepository',
    'ICommerceConfigRepository',
  ],
})
export class PrismaModule {}
