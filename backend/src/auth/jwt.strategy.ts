import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret';

interface JwtPayload {
    username: string;
    sub: number;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(),
        });
    }

    /**
     * Validates JWT token and returns payload
     * @param payload Decoded JWT payload
     * @returns User payload object
     */
    validate(payload: JwtPayload) {
        return {
            id: payload.sub,
            username: payload.username,
            role: payload.role,
        };
    }
}
