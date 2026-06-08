import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyAccount } from '../property/property.entity';
import { WaterBillsController } from './water-bills.controller';
import { WaterBilling } from './water-billing.entity';
import { WaterBillsService } from './water-bills.service';

@Module({
    imports: [TypeOrmModule.forFeature([WaterBilling, PropertyAccount])],
    controllers: [WaterBillsController],
    providers: [WaterBillsService],
})
export class WaterBillsModule { }
