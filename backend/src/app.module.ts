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
import { QuarterlyReportSnapshot } from './reports/quarterly-report.entity';
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
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'hoa_user',
      password: process.env.DB_PASS || 'strongpassword',
      database: process.env.DB_NAME || 'hoa_portal',
      entities: [
        Admin,
        AdminActivity,
        PropertyAccount,
        Billing,
        FoxproBilling,
        FoxproPayment,
        Announcement,
        QuarterlyReportSnapshot,
      ],
      synchronize: true, // auto create tables
    }),
    TypeOrmModule.forFeature([
      Admin,
      AdminActivity,
      PropertyAccount,
      Billing,
      FoxproBilling,
      FoxproPayment,
      Announcement,
      QuarterlyReportSnapshot,
    ]),
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