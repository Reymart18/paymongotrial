import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PropertyAccount } from './property.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyAccount]), AuthModule],
  providers: [PropertyService],
  controllers: [PropertyController],
})
export class PropertyModule { }
