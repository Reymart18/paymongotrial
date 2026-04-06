import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BillingService } from './billing.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('billings')
export class BillingController {
    constructor(private billingService: BillingService) { }

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
    async uploadBillings(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can upload billings');
        }

        return this.billingService.uploadBillings(file);
    }
}
