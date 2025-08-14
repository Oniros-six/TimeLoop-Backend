import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CustomerModule } from './interfaces/controllers/customer/customer.module';
import { BookingModule } from './interfaces/controllers/booking/booking.module';
import { ActivityLogModule } from './domain/services/activityLog/activity-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CustomerModule,
    BookingModule,
    ActivityLogModule,
  ],
})
export class AppModule {}
