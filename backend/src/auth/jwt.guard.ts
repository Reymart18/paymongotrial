import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Guard for protecting routes
 * Validates JWT token from Authorization header
 * Attaches decoded user info to request.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * Handle authentication errors
     * @param err Error from passport strategy
     * @param user User object from strategy
     * @param info Additional info from strategy
     * @throws UnauthorizedException if authentication fails
     */
    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or missing token');
        }
        return user;
    }
}
