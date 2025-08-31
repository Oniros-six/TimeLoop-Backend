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
import { UserWorkingPatternModule } from './interfaces/controllers/userWorkingPattern/userWorkingPattern.module';
import { CommerceWorkingPatternModule } from './interfaces/controllers/commerceWorkingPattern/commerceWorkingPattern.module';
import { UserWorkingOverrideModule } from './interfaces/controllers/userWorkingOverride/userWorkingOverride.module';
import { CommerceWorkingOverrideModule } from './interfaces/controllers/commerceWorkingOverride/commerceWorkingOverride.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationModule } from './domain/services/notifications/notifications.module';
import { RemindersModule } from './domain/services/reminders/reminders.module';
import { AuthModule } from './interfaces/controllers/auth/auth.module';
import { BookingHistoryModule } from './interfaces/controllers/bookingHistory/bookingHistory.module';
import { InvoiceModule } from './interfaces/controllers/invoices/invoice.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MercadoPagoModule } from './interfaces/controllers/mercadoPago/mercadoPago.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    UserModule,
    CustomerModule,
    BookingModule,
    ActivityLogModule,
    ServicesModule,
    CommerceModule,
    UserConfigModule,
    CommerceConfigModule,
    UserWorkingPatternModule,
    CommerceWorkingPatternModule,
    UserWorkingOverrideModule,
    CommerceWorkingOverrideModule,
    NotificationModule,
    RemindersModule,
    AuthModule,
    BookingHistoryModule,
    InvoiceModule,
    MercadoPagoModule
  ],
})
export class AppModule {}
