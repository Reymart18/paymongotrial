import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PropertyAccount } from '../property/property.entity';
import { PaymongoService } from './paymongo.service';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        role: string;
    };
}

interface WebhookRequest extends ExpressRequest {
    rawBody?: Buffer;
}

@Controller('paymongo')
export class PaymongoController {
    constructor(
        private readonly paymongoService: PaymongoService,
        @InjectRepository(PropertyAccount)
        private readonly propertyRepo: Repository<PropertyAccount>,
    ) { }

    @Post('webhook')
    async handleWebhook(@Request() req: WebhookRequest) {
        const signatureHeader = req.headers['paymongo-signature'];
        const signature = Array.isArray(signatureHeader)
            ? signatureHeader[0]
            : signatureHeader;
        return this.paymongoService.handleWebhook(
            req.body,
            signature,
            req.rawBody as Buffer,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/:accountId')
    async createCheckout(
        @Param('accountId') accountId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new BadRequestException('Account not found');
        }

        if (req.user.role === 'homeowner' && account.id !== req.user.id) {
            throw new ForbiddenException('You can only pay your own account');
        }

        const amount = Number(account.balance || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('This account has no amount due');
        }

        return this.paymongoService.createCheckoutSession(
            accountId,
            account.memberName || accountId,
            amount,
        );
    }
}
