import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SyncApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const expected = process.env.SYNC_API_KEY || '';
        if (!expected) {
            throw new UnauthorizedException('Sync API key is not configured.');
        }

        const request = context.switchToHttp().getRequest<Request>();
        const authorization = request.header('authorization') || '';
        const bearerToken = authorization.toLowerCase().startsWith('bearer ')
            ? authorization.slice(7).trim()
            : '';
        const apiKey = request.header('x-api-key') || '';

        if (bearerToken === expected || apiKey === expected) {
            return true;
        }

        throw new UnauthorizedException('Invalid sync API key.');
    }
}
