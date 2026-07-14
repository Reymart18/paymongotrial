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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request as ExpressRequest } from 'express';

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
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createAdmin(
        @Body() body: { username: string; password: string; fullName: string; role?: string },
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can create admin accounts');
        }

        const requestedRole = body.role || 'admin';
        if (requestedRole !== 'admin' && requestedRole !== 'super_admin') {
            throw new BadRequestException('Invalid role value');
        }

        try {
            const admin = await this.adminService.createAdmin(
                body.username,
                body.password,
                body.fullName,
                requestedRole,
            );
            const { password, ...result } = admin;
            return result;
        } catch (error) {
            return { message: 'Failed to create admin', error: error.message };
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllAdmins(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can access admin accounts');
        }

        const admins = await this.adminService.getAllAdmins();
        return admins.map(({ password, ...admin }) => admin);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':adminId')
    async deleteAdmin(
        @Param('adminId') adminId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can delete admin accounts');
        }

        const resolvedId = Number(adminId);
        if (!Number.isFinite(resolvedId)) {
            throw new BadRequestException('Invalid admin ID');
        }

        if (resolvedId === req.user.id) {
            throw new BadRequestException('You cannot delete your own account');
        }

        const result = await this.adminService.deleteAdmin(resolvedId);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'delete_admin',
            targetType: 'admin',
            targetId: adminId,
            details: 'Deleted admin account.',
        });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post(':adminId/reset-password')
    async resetAdminPassword(
        @Param('adminId') adminId: string,
        @Body() body: { newPassword: string },
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can reset admin passwords');
        }

        const resolvedId = Number(adminId);
        if (!Number.isFinite(resolvedId)) {
            throw new BadRequestException('Invalid admin ID');
        }

        if (!body?.newPassword || body.newPassword.trim().length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }

        const result = await this.adminService.resetAdminPassword(resolvedId, body.newPassword.trim());
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'reset_admin_password',
            targetType: 'admin',
            targetId: adminId,
            details: 'Reset admin password.',
        });
        const { password, ...sanitized } = result;
        return sanitized;
    }

    @UseGuards(JwtAuthGuard)
    @Get('property-accounts')
    async getAllPropertyAccounts(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const accounts = await this.adminService.getAllPropertyAccounts();
        return accounts.map(({ password, ...account }) => account);
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard-summary')
    async getDashboardSummary(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getDashboardSummary();
    }

    @UseGuards(JwtAuthGuard)
    @Get('payments-collection')
    async getPaymentsCollection(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getPaymentsCollectionReport();
    }

    @UseGuards(JwtAuthGuard)
    @Get('payments-by-category')
    async getPaymentsByCategory(
        @Request() req: AuthenticatedRequest,
        @Query('paycat') paycat?: string,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getPaymentsByCategoryReport(paycat ?? '');
    }

    @UseGuards(JwtAuthGuard)
    @Get('settled-accounts')
    async getSettledAccounts(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getSettledAccountsReport();
    }

    @UseGuards(JwtAuthGuard)
    @Get('overpaid-accounts')
    async getOverpaidAccounts(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getOverpaidAccountsReport();
    }

    @UseGuards(JwtAuthGuard)
    @Get('unpaid-accounts')
    async getUnpaidAccounts(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getUnpaidAccountsReport();
    }

    @UseGuards(JwtAuthGuard)
    @Get('not-good-standing')
    async getNotGoodStanding(
        @Request() req: AuthenticatedRequest,
        @Query('status') status?: string,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        return this.adminService.getNotGoodStandingReport(status);
    }

    @UseGuards(JwtAuthGuard)
    @Get('activities')
    async getRecentActivities(
        @Request() req: AuthenticatedRequest,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access this resource');
        }

        const parsedLimit = limit ? Number(limit) : undefined;
        const parsedPage = page ? Number(page) : undefined;
        return this.adminService.getRecentActivities(
            Number.isFinite(parsedLimit) ? parsedLimit : undefined,
            Number.isFinite(parsedPage) ? parsedPage : undefined,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('property-accounts/:accountId')
    async updatePropertyAccount(
        @Param('accountId') accountId: string,
        @Body() updates: Record<string, unknown>,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can update accounts');
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
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can delete accounts');
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
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can reset passwords');
        }

        const result = await this.adminService.resetPropertyAccountPassword(accountId);
        await this.adminService.logActivity({
            actorId: req.user.id,
            actorUsername: req.user.username,
            action: 'reset_password',
            targetType: 'property_account',
            targetId: accountId,
            details: 'Generated and emailed a new temporary member password.',
        });
        return result;
    }

}
