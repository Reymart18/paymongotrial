import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { username: string; password: string }) {
        const user = await this.authService.validateAdmin(body.username, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('login/homeowner')
    async loginHomeowner(@Body() body: { accountId: string; password: string }) {
        return this.authService.startHomeownerLogin(body.accountId, body.password);
    }

    @Post('login/homeowner/verify')
    async verifyHomeownerOtp(@Body() body: { accountId: string; otp: string }) {
        return this.authService.verifyHomeownerOtp(body.accountId, body.otp);
    }
}