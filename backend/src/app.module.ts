import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin/admin.entity';
import { PropertyAccount } from './property/property.entity';
import { Billing } from './billing/billing.entity';
import { FoxproBilling } from './foxpro/foxpro-billing.entity';
import { FoxproPayment } from './foxpro/foxpro-payment.entity';
import { AdminActivity } from './admin/admin-activity.entity';
import { Announcement } from './announcements/announcement.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PropertyModule } from './property/property.module';
import { StatementsModule } from './statements/statements.module';
import { BillingModule } from './billing/billing.module';
import { FoxproModule } from './foxpro/foxpro.module';
import { ReportsModule } from './reports/reports.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'hoa_user',
      password: 'strongpassword',
      database: 'hoa_portal',
      entities: [Admin, AdminActivity, PropertyAccount, Billing, FoxproBilling, FoxproPayment, Announcement],
      synchronize: true, // auto create tables
    }),
    TypeOrmModule.forFeature([Admin, AdminActivity, PropertyAccount, Billing, FoxproBilling, FoxproPayment, Announcement]),
    AuthModule,
    AdminModule,
    PropertyModule,
    StatementsModule,
    BillingModule,
    FoxproModule,
    ReportsModule,
    AnnouncementsModule,
  ],
})
export class AppModule { }