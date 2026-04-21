import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoxproBilling } from './foxpro-billing.entity';
import { FoxproPayment } from './foxpro-payment.entity';
import { FoxproService } from './foxpro.service';
import { FoxproController } from './foxpro.controller';
import { PropertyAccount } from '../property/property.entity';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FoxproBilling, FoxproPayment, PropertyAccount]),
        AuthModule,
        PropertyModule,
        AdminModule,
    ],
    providers: [FoxproService],
    controllers: [FoxproController],
    exports: [FoxproService],
})
export class FoxproModule { }
