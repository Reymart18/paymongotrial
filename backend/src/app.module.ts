import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin/admin.entity';
import { PropertyAccount } from './property/property.entity';
import { Payment } from './payments/payment.entity';
import { Billing } from './billing/billing.entity';
import { FoxproBilling } from './foxpro/foxpro-billing.entity';
import { FoxproPayment } from './foxpro/foxpro-payment.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PropertyModule } from './property/property.module';
import { PaymentsModule } from './payments/payments.module';
import { StatementsModule } from './statements/statements.module';
import { BillingModule } from './billing/billing.module';
import { FoxproModule } from './foxpro/foxpro.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'hoa_user',
      password: 'strongpassword',
      database: 'hoa_portal',
      entities: [Admin, PropertyAccount, Payment, Billing, FoxproBilling, FoxproPayment],
      synchronize: true, // auto create tables
    }),
    TypeOrmModule.forFeature([Admin, PropertyAccount, Payment, Billing, FoxproBilling, FoxproPayment]),
    AuthModule,
    AdminModule,
    PropertyModule,
    PaymentsModule,
    StatementsModule,
    BillingModule,
    FoxproModule,
    ReportsModule,
  ],
})
export class AppModule { }