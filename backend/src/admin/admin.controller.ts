import { Controller, Post, Body, Get, UseGuards, ForbiddenException, Request } from '@nestjs/common';
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
    constructor(private adminService: AdminService) { }

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
}
