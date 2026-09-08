import { Body, Controller, ForbiddenException, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SyncApiKeyGuard } from './sync-api-key.guard';
import { SyncService } from './sync.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('sync')
export class SyncController {
    constructor(private syncService: SyncService) { }

    @UseGuards(JwtAuthGuard)
    @Post('request/members')
    requestMembers(@Request() req: AuthenticatedRequest) {
        this.assertAdmin(req);
        return this.syncService.createRequest('members', req.user.username || `admin:${req.user.id}`);
    }

    @UseGuards(JwtAuthGuard)
    @Post('request/payments')
    requestPayments(@Request() req: AuthenticatedRequest) {
        this.assertAdmin(req);
        return this.syncService.createRequest('payments', req.user.username || `admin:${req.user.id}`);
    }

    @UseGuards(JwtAuthGuard)
    @Post('request/billing')
    requestBilling(@Request() req: AuthenticatedRequest) {
        this.assertAdmin(req);
        return this.syncService.createRequest('billing', req.user.username || `admin:${req.user.id}`);
    }

    @UseGuards(JwtAuthGuard)
    @Post('request/adjustments')
    requestAdjustments(@Request() req: AuthenticatedRequest) {
        this.assertAdmin(req);
        return this.syncService.createRequest('adjustments', req.user.username || `admin:${req.user.id}`);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status')
    getStatus(@Request() req: AuthenticatedRequest) {
        this.assertAdmin(req);
        return this.syncService.getStatus();
    }

    @UseGuards(SyncApiKeyGuard)
    @Get('requests/pending')
    getPendingRequests() {
        return this.syncService.getPendingRequests();
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('requests/:id/start')
    startRequest(@Param('id') id: string) {
        return this.syncService.startRequest(Number(id));
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('requests/:id/complete')
    completeRequest(
        @Param('id') id: string,
        @Body() body: { recordsProcessed?: number; recordsUpdated?: number },
    ) {
        return this.syncService.completeRequest(
            Number(id),
            body?.recordsProcessed,
            body?.recordsUpdated,
        );
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('requests/:id/fail')
    failRequest(
        @Param('id') id: string,
        @Body() body: { errorMessage?: string; recordsProcessed?: number; recordsUpdated?: number },
    ) {
        return this.syncService.failRequest(
            Number(id),
            body?.errorMessage || 'Sync failed.',
            body?.recordsProcessed,
            body?.recordsUpdated,
        );
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('members')
    receiveMembers(@Body() body: unknown) {
        return this.syncService.receiveMembers(body);
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('payments')
    receivePayments(@Body() body: unknown) {
        return this.syncService.receivePayments(body);
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('payments/reconcile')
    reconcilePayments(@Body() body: unknown) {
        return this.syncService.reconcilePayments(body);
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('billings')
    receiveBillings(@Body() body: unknown) {
        return this.syncService.receiveBillings(body);
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('adjustments')
    receiveAdjustments(@Body() body: unknown) {
        return this.syncService.receiveAdjustments(body);
    }

    @UseGuards(SyncApiKeyGuard)
    @Post('adjustments/reconcile')
    reconcileAdjustments(@Body() body: unknown) {
        return this.syncService.reconcileAdjustments(body);
    }

    private assertAdmin(req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can access sync controls.');
        }
    }
}
