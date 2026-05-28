import { Controller, Get, Param, UseGuards, Request, ForbiddenException, Post, Body, NotFoundException } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PropertyService } from './property.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('property')
export class PropertyController {
    constructor(private propertyService: PropertyService) { }

    @Post('account')
    async createHomeowner(
        @Body()
        body: {
            neighborhood: string;
            block: string;
            lot: string;
            memberName: string;
            propertySizeSqm: number;
            classification: string;
            username: string;
            password: string;
        },
    ) {
        const homeowner = await this.propertyService.createHomeowner(body);
        const { password, ...result } = homeowner;
        return result;
    }

    /**
     * Protected route: Get property account details
     * Only accessible by homeowner whose accountId matches the route parameter
     * @param accountId Property account ID from route
     * @param req Authenticated request with user info
     * @returns Property account details
     * @throws ForbiddenException if user's accountId doesn't match route param
     * @throws UnauthorizedException if no valid JWT token
     */
    @UseGuards(JwtAuthGuard)
    @Get('account/:accountId')
    async getAccountDetails(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        // Allow admins to inspect any account; homeowners can only access their own.
        if (req.user.role !== 'homeowner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only homeowners or admins can access this resource');
        }

        const account = await this.propertyService.getByAccountId(accountId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        if (req.user.role === 'homeowner' && account.id !== req.user.id) {
            throw new ForbiddenException('You can only access your own account');
        }

        const { password, ...result } = account;
        const goodStandingStatus = await this.propertyService.getGoodStandingStatus(accountId);
        return { ...result, goodStandingStatus };
    }

    @UseGuards(JwtAuthGuard)
    @Post('recalculate-balances')
    async recalculateBalances(@Request() req: AuthenticatedRequest) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can recalculate balances');
        }

        return this.propertyService.recalculateBalances();
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @Body() body: { oldPassword: string; newPassword: string },
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'homeowner') {
            throw new ForbiddenException('Only homeowners can change their password');
        }

        await this.propertyService.changePassword(req.user.id, body.oldPassword, body.newPassword);
        return { success: true };
    }
}
