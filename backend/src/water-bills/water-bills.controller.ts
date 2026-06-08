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
    constructor(private waterBillsService: WaterBillsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('account/:accountId')
    async getWaterBillingsByAccount(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can preview water billings');
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
