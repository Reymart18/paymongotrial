import {
  Body,
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ServiceRequestsService } from './service-requests.service';
import type { CreateServiceRequestInput } from './service-requests.service';
import type { CreateServiceComplaintInput } from './service-requests.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private serviceRequestsService: ServiceRequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: CreateServiceRequestInput,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can submit requests');
    }

    return this.serviceRequestsService.createForHomeowner(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('self')
  async getOwnRequests(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can access this resource');
    }

    return this.serviceRequestsService.getForHomeowner(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complaints')
  @UseInterceptors(
    FileInterceptor('evidence', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const destination = 'uploads/complaints';
          mkdirSync(destination, { recursive: true });
          cb(null, destination);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueName}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Evidence must be a JPG, PNG, WEBP, or PDF file',
            ),
            false,
          );
        }
        return cb(null, true);
      },
    }),
  )
  async createComplaint(
    @Body() body: CreateServiceComplaintInput,
    @UploadedFile() evidence: Express.Multer.File | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can file complaints');
    }

    return this.serviceRequestsService.createComplaintForHomeowner(
      req.user.id,
      body,
      evidence,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('complaints/self')
  async getOwnComplaints(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can access this resource');
    }

    return this.serviceRequestsService.getComplaintsForHomeowner(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('complaints')
  async getAllComplaints(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException(
        'Only admins can access all service complaints',
      );
    }

    return this.serviceRequestsService.getAllComplaintsForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('complaints/:id/status')
  async updateComplaintStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminReply?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Only admins can update complaint status');
    }

    const complaintId = Number(id);
    if (!Number.isInteger(complaintId)) {
      throw new BadRequestException('Invalid complaint ID');
    }

    return this.serviceRequestsService.updateComplaintStatus(
      complaintId,
      body.status,
      body.adminReply,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminReply?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Only admins can update request status');
    }

    const requestId = Number(id);
    if (!Number.isInteger(requestId)) {
      throw new BadRequestException('Invalid request ID');
    }

    return this.serviceRequestsService.updateRequestStatus(
      requestId,
      body.status,
      body.adminReply,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllRequests(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException(
        'Only admins can access all service requests',
      );
    }

    return this.serviceRequestsService.getAllForAdmin();
  }
}
