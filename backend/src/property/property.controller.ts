import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

    @UseGuards(JwtAuthGuard)
    @Post('soa/upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 20 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const name = file.originalname.toLowerCase();
                const allowed = name.endsWith('.xlsx') || name.endsWith('.xls');

                if (!allowed) {
                    return cb(new BadRequestException('Only XLS or XLSX files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async uploadSoaNumbers(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can upload SOA numbers');
        }

        return this.propertyService.uploadSoaNumbers(file);
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

    @UseGuards(JwtAuthGuard)
    @Post('member-agreement')
    async acceptMemberAgreement(
        @Body() body: { version?: string },
        @Request() req: AuthenticatedRequest,
    ) {
        if (req.user.role !== 'homeowner') {
            throw new ForbiddenException('Only homeowners can accept the member agreement');
        }

        await this.propertyService.acceptMemberAgreement(req.user.id, body?.version || '');
        return { success: true };
    }
}
