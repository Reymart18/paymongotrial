import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin/admin.entity';
import { PropertyAccount } from './property/property.entity';
import { Billing } from './billing/billing.entity';
import { FoxproBilling } from './foxpro/foxpro-billing.entity';
import { FoxproPayment } from './foxpro/foxpro-payment.entity';
import { FoxproAdjustment } from './foxpro/foxpro-adjustment.entity';
import { AdminActivity } from './admin/admin-activity.entity';
import { MemberInvitationBatch } from './admin/member-invitation-batch.entity';
import { Announcement } from './announcements/announcement.entity';
import { QuarterlyReportSnapshot } from './reports/quarterly-report.entity';
import { WaterBilling } from './water-bills/water-billing.entity';
import { ServiceRequest } from './service-requests/service-request.entity';
import { ServiceComplaint } from './service-requests/service-complaint.entity';
import { SyncRequest } from './sync/sync-request.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PropertyModule } from './property/property.module';
import { StatementsModule } from './statements/statements.module';
import { BillingModule } from './billing/billing.module';
import { FoxproModule } from './foxpro/foxpro.module';
import { ReportsModule } from './reports/reports.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { WaterBillsModule } from './water-bills/water-bills.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { SyncModule } from './sync/sync.module';

function shouldSynchronizeDatabase(): boolean {
  const configured = String(process.env.TYPEORM_SYNCHRONIZE || '').trim().toLowerCase();
  if (configured === 'true') {
    return true;
  }
  if (configured === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
}

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
        MemberInvitationBatch,
        PropertyAccount,
        Billing,
        FoxproBilling,
        FoxproPayment,
        FoxproAdjustment,
        Announcement,
        QuarterlyReportSnapshot,
        WaterBilling,
        ServiceRequest,
        ServiceComplaint,
        SyncRequest,
      ],
      synchronize: shouldSynchronizeDatabase(),
    }),
    TypeOrmModule.forFeature([
      Admin,
      AdminActivity,
      MemberInvitationBatch,
      PropertyAccount,
      Billing,
      FoxproBilling,
      FoxproPayment,
      FoxproAdjustment,
      Announcement,
      QuarterlyReportSnapshot,
      WaterBilling,
      ServiceRequest,
      ServiceComplaint,
      SyncRequest,
    ]),
    AuthModule,
    AdminModule,
    PropertyModule,
    StatementsModule,
    BillingModule,
    FoxproModule,
    ReportsModule,
    AnnouncementsModule,
    WaterBillsModule,
    ServiceRequestsModule,
    SyncModule,
  ],
})
export class AppModule {}
