import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Get,
    Param,
    Request,
    UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PropertyAccount } from '../property/property.entity';
import { StatementsService, type MonthlyStatementRow } from './statements.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('statements')
export class StatementsController {
    constructor(
        private statementsService: StatementsService,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get(':accountId')
    async getStatement(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<MonthlyStatementRow[]> {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new BadRequestException('Account not found');
        }

        if (req.user.role === 'homeowner' && account.id !== req.user.id) {
            throw new ForbiddenException('You can only access your own statement');
        }

        if (req.user.role !== 'homeowner' && req.user.role !== 'admin') {
            throw new ForbiddenException('You are not allowed to access this resource');
        }

        return this.statementsService.getMonthlyStatement(accountId);
    }
}
