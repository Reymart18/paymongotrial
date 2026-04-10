import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PropertyAccount } from './property.entity';
import { AuthModule } from '../auth/auth.module';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyAccount, FoxproBilling, FoxproPayment]), AuthModule],
  providers: [PropertyService],
  controllers: [PropertyController],
  exports: [PropertyService],
})
export class PropertyModule { }
