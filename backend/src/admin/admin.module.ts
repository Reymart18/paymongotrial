import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin } from './admin.entity';
import { AdminActivity } from './admin-activity.entity';
import { MemberInvitationBatch } from './member-invitation-batch.entity';
import { PropertyAccount } from '../property/property.entity';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, AdminActivity, MemberInvitationBatch, PropertyAccount, FoxproBilling, FoxproPayment]), AuthModule, PropertyModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule { }
