import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { AuthModule } from '../auth/auth.module';
import { OnlinePayment } from '../paymongo/online-payment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FoxproBilling, FoxproPayment, PropertyAccount, OnlinePayment]),
        AuthModule,
    ],
    providers: [StatementsService],
    controllers: [StatementsController],
})
export class StatementsModule { }
