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
import { AdminService } from '../admin/admin.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('foxpro')
export class FoxproController {
    constructor(
        private foxproService: FoxproService,
        private adminService: AdminService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('billings/upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed =
                    file.originalname.toLowerCase().endsWith('.csv') ||
                    file.originalname.toLowerCase().endsWith('.xlsx') ||
                    file.originalname.toLowerCase().endsWith('.xls') ||
                    file.originalname.toLowerCase().endsWith('.dbf');

                if (!allowed) {
                    return cb(new BadRequestException('Only CSV, XLSX, or DBF files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async uploadBillings(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can upload FoxPro billings');
        }

        const result = await this.foxproService.uploadBillings(file);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'upload_billings',
            targetType: 'foxpro_billings',
            targetId: file?.originalname ?? null,
            details: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`,
        });
        return result;
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
                    file.originalname.toLowerCase().endsWith('.xls') ||
                    file.originalname.toLowerCase().endsWith('.dbf');

                if (!allowed) {
                    return cb(new BadRequestException('Only CSV, XLSX, or DBF files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async uploadPayments(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can upload FoxPro payments');
        }

        const result = await this.foxproService.uploadPayments(file);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'upload_payments',
            targetType: 'foxpro_payments',
            targetId: file?.originalname ?? null,
            details: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`,
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('payments/sync')
    async syncPayments(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can sync FoxPro payments');
        }

        const result = await this.foxproService.syncPaymentsFromDbf();
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'sync_payments_dbf',
            targetType: 'foxpro_payments',
            targetId: 'payments.DBF',
            details: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`,
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('billings/sync')
    async syncBillings(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can sync FoxPro billings');
        }

        const result = await this.foxproService.syncBillingsFromDbf();
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'sync_billings_dbf',
            targetType: 'foxpro_billings',
            targetId: 'BILLING.DBF',
            details: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`,
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('members/sync')
    async syncMembers(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can sync FoxPro members');
        }

        const result = await this.foxproService.syncMembersFromDbf();
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'sync_members_dbf',
            targetType: 'foxpro_members',
            targetId: 'MEMBERS.DBF',
            details: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`,
        });
        return result;
    }
}
