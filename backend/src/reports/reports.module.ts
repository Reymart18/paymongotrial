import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { FoxproAdjustment } from '../foxpro/foxpro-adjustment.entity';
import { QuarterlyReportSnapshot } from './quarterly-report.entity';
import { PropertyAccount } from '../property/property.entity';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    imports: [TypeOrmModule.forFeature([FoxproBilling, FoxproPayment, FoxproAdjustment, QuarterlyReportSnapshot, PropertyAccount]), AuthModule],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
