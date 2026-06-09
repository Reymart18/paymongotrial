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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PropertyAccount } from '../property/property.entity';
import { WaterBillsService } from './water-bills.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('water-bills')
export class WaterBillsController {
    constructor(
        private waterBillsService: WaterBillsService,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('account/:accountId')
    async getWaterBillingsByAccount(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new BadRequestException('Account not found');
        }

        if (req.user.role === 'homeowner' && account.id !== req.user.id) {
            throw new ForbiddenException('You can only access your own water billings');
        }

        if (req.user.role !== 'homeowner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('You are not allowed to access this resource');
        }

        return this.waterBillsService.getWaterBillingsByAccount(accountId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 20 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const name = file.originalname.toLowerCase();
                const allowed = name.endsWith('.xlsx') || name.endsWith('.xls');

                if (!allowed) {
                    return cb(new BadRequestException('Only XLS or XLSX files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async uploadWaterBillings(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can upload water billings');
        }

        return this.waterBillsService.uploadWaterBillings(file);
    }
}
