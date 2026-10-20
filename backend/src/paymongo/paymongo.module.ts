import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyAccount } from '../property/property.entity';
import { PaymongoController } from './paymongo.controller';
import { OnlinePayment } from './online-payment.entity';
import { PaymongoService } from './paymongo.service';

@Module({
    imports: [TypeOrmModule.forFeature([PropertyAccount, OnlinePayment])],
    controllers: [PaymongoController],
    providers: [PaymongoService],
})
export class PaymongoModule { }
