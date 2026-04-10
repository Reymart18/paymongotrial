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
import { FoxproService } from './foxpro.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('foxpro')
export class FoxproController {
    constructor(private foxproService: FoxproService) { }

    @UseGuards(JwtAuthGuard)
    @Post('billings/upload')
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
            throw new ForbiddenException('Only admins can upload FoxPro billings');
        }

        return this.foxproService.uploadBillings(file);
    }

    @UseGuards(JwtAuthGuard)
    @Post('payments/upload')
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
            throw new ForbiddenException('Only admins can upload FoxPro payments');
        }

        return this.foxproService.uploadPayments(file);
    }
}
