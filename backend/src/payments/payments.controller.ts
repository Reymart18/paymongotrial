import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Get,
    Param,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';
import { PropertyAccount } from '../property/property.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed =
                    file.originalname.toLowerCase().endsWith('.csv') ||
                    file.originalname.toLowerCase().endsWith('.xlsx') ||
                    file.originalname.toLowerCase().endsWith('.xls');

                if (!allowed) {
                    return cb(new BadRequestException('Only CSV or XLSX files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async uploadPayments(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can upload payments');
        }

        return this.paymentsService.uploadPayments(file);
    }

    @UseGuards(JwtAuthGuard)
    @Get('account/:accountId')
    async getAccountPayments(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new BadRequestException('Account not found');
        }

        if (req.user.role === 'homeowner' && account.id !== req.user.id) {
            throw new ForbiddenException('You can only access your own account');
        }

        if (req.user.role !== 'homeowner' && req.user.role !== 'admin') {
            throw new ForbiddenException('You are not allowed to access this resource');
        }

        return this.paymentsService.getPaymentsByAccountId(accountId);
    }
}
