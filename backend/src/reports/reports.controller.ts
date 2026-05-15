import { Controller, Get, Query, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportsService, type OverdueAccount, type QuarterReport } from './reports.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyAccount } from '../property/property.entity';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('reports')
export class ReportsController {
    constructor(
        private reportsService: ReportsService,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('quarter')
    async getQuarterReport(
        @Query('year') year: string,
        @Query('quarter') quarter: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<QuarterReport | { message: string }> {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access reports');
        }

        const yearValue = Number(year);
        const quarterValue = Number(quarter);

        if (!yearValue || !quarterValue || quarterValue < 1 || quarterValue > 4) {
            return {
                message: 'Invalid year or quarter. Expected year=YYYY and quarter=1-4.',
            };
        }

        return this.reportsService.getQuarterSummary(yearValue, quarterValue);
    }

    @UseGuards(JwtAuthGuard)
    @Get('overdue')
    async getOverdueAccounts(
        @Request() req: AuthenticatedRequest,
    ): Promise<OverdueAccount[]> {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access reports');
        }

        return this.reportsService.getOverdueAccounts();
    }

    @UseGuards(JwtAuthGuard)
    @Get('overdue/self')
    async getOverdueSelf(
        @Request() req: AuthenticatedRequest,
    ): Promise<OverdueAccount | null> {
        if (req.user.role !== 'homeowner') {
            throw new ForbiddenException('Only homeowners can access this report');
        }

        const account = await this.propertyRepo.findOne({ where: { id: req.user.id } });
        const accountId = account?.accountId ?? req.user.username ?? '';

        return this.reportsService.getOverdueAccount(accountId);
    }
}
