import { Controller, Get, Query, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportsService, type QuarterReport } from './reports.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('reports')
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('quarter')
    async getQuarterReport(
        @Query('year') year: string,
        @Query('quarter') quarter: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<QuarterReport | { message: string }> {
        if (req.user.role !== 'admin') {
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
}
