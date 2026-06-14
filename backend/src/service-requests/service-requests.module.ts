import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyAccount } from '../property/property.entity';
import { ServiceRequest } from './service-request.entity';
import { ServiceComplaint } from './service-complaint.entity';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      ServiceComplaint,
      PropertyAccount,
    ]),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
