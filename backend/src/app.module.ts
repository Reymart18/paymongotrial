import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin/admin.entity';
import { PropertyAccount } from './property/property.entity';
import { Payment } from './payments/payment.entity';
import { Billing } from './billing/billing.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PropertyModule } from './property/property.module';
import { PaymentsModule } from './payments/payments.module';
import { StatementsModule } from './statements/statements.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'hoa_user',
      password: 'strongpassword',
      database: 'hoa_portal',
      entities: [Admin, PropertyAccount, Payment, Billing],
      synchronize: true, // auto create tables
    }),
    TypeOrmModule.forFeature([Admin, PropertyAccount, Payment, Billing]),
    AuthModule,
    AdminModule,
    PropertyModule,
    PaymentsModule,
    StatementsModule,
    BillingModule,
  ],
})
export class AppModule { }