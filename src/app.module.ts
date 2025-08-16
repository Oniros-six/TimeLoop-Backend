import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityLogModule } from './domain/services/activityLog/activity-log.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CustomerModule } from './interfaces/controllers/customer/customer.module';
import { BookingModule } from './interfaces/controllers/booking/booking.module';
import { ServicesModule } from './interfaces/controllers/services/services.module';
import { CommerceModule } from './interfaces/controllers/commerces/commerce.module';
import { UserModule } from './interfaces/controllers/user/user.module';
import { UserConfigModule } from './interfaces/controllers/userConfig/userConfig.module';
import { CommerceConfigModule } from './interfaces/controllers/commerceConfig/commerceConfig.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UserModule,
    CustomerModule,
    BookingModule,
    ActivityLogModule,
    ServicesModule,
    CommerceModule,
    UserConfigModule,
    CommerceConfigModule,
  ],
})
export class AppModule {}
