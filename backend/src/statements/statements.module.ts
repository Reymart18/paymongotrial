import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { Billing } from '../billing/billing.entity';
import { Payment } from '../payments/payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Billing, Payment, PropertyAccount]),
        AuthModule,
    ],
    providers: [StatementsService],
    controllers: [StatementsController],
})
export class StatementsModule { }
