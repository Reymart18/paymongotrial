import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoxproBilling } from './foxpro-billing.entity';
import { FoxproPayment } from './foxpro-payment.entity';
import { FoxproAdjustment } from './foxpro-adjustment.entity';
import { FoxproService } from './foxpro.service';
import { FoxproController } from './foxpro.controller';
import { FoxproSyncService } from './foxpro-sync.service';
import { PropertyAccount } from '../property/property.entity';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { AdminModule } from '../admin/admin.module';
import { QuarterlyReportSnapshot } from '../reports/quarterly-report.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            FoxproBilling,
            FoxproPayment,
            FoxproAdjustment,
            PropertyAccount,
            QuarterlyReportSnapshot,
        ]),
        AuthModule,
        PropertyModule,
        AdminModule,
    ],
    providers: [FoxproService, FoxproSyncService],
    controllers: [FoxproController],
    exports: [FoxproService],
})
export class FoxproModule { }
