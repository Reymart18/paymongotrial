import {
    BadRequestException,
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    ForbiddenException,
    Request,
    Patch,
    Param,
    Query,
    Delete,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request as ExpressRequest } from 'express';
import { PropertyService } from '../property/property.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('admin')
export class AdminController {
    constructor(
        private adminService: AdminService,
        private propertyService: PropertyService,
    ) { }

    @Post('create')
    async createAdmin(
        @Body() body: { username: string; password: string; fullName: string; role?: string },
    ) {
        try {
            const admin = await this.adminService.createAdmin(
                body.username,
                body.password,
                body.fullName,
                body.role || 'admin',
            );
            const { password, ...result } = admin;
            return result;
        } catch (error) {
            return { message: 'Failed to create admin', error: error.message };
        }
    }

    @Get()
    async getAllAdmins() {
        const admins = await this.adminService.getAllAdmins();
        return admins.map(({ password, ...admin }) => admin);
    }

    @UseGuards(JwtAuthGuard)
    @Get('property-accounts')
    async getAllPropertyAccounts(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const accounts = await this.adminService.getAllPropertyAccounts();
        return accounts.map(({ password, ...account }) => account);
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard-summary')
    async getDashboardSummary(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getDashboardSummary();
    }

    @UseGuards(JwtAuthGuard)
    @Get('activities')
    async getRecentActivities(
        @Request() req: AuthenticatedRequest,
        @Query('limit') limit?: string,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const parsedLimit = limit ? Number(limit) : undefined;
        return this.adminService.getRecentActivities(
            Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('property-accounts/:accountId')
    async updatePropertyAccount(
        @Param('accountId') accountId: string,
        @Body() updates: Record<string, unknown>,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const account = await this.adminService.updatePropertyAccount(accountId, updates);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'update_member',
            targetType: 'property_account',
            targetId: accountId,
            details: 'Updated member profile details.',
        });
        const { password, ...result } = account;
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Delete('property-accounts/:accountId')
    async deletePropertyAccount(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const result = await this.adminService.deletePropertyAccount(accountId);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'delete_member',
            targetType: 'property_account',
            targetId: accountId,
            details: 'Deleted member account.',
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('property-accounts/:accountId/reset-password')
    async resetPropertyAccountPassword(
        @Param('accountId') accountId: string,
        @Body() body: { newPassword: string },
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can reset passwords');
        }

        const result = await this.adminService.resetPropertyAccountPassword(accountId, body.newPassword);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'reset_password',
            targetType: 'property_account',
            targetId: accountId,
            details: 'Reset member password.',
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('masterlist/upload')
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
    async uploadMasterlist(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can upload masterlists');
        }

        const result = await this.propertyService.uploadMasterlist(file);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'upload_masterlist',
            targetType: 'masterlist',
            targetId: file?.originalname ?? null,
            details: `Inserted ${result.inserted}, skipped ${result.skipped}.`,
        });
        return result;
    }
}
