import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { username: string; password: string }) {
        const user = await this.authService.validateAdmin(body.username, body.password);
        if (!user) return { message: 'Invalid credentials' };
        return this.authService.login(user);
    }

    @Post('login/homeowner')
    async loginHomeowner(@Body() body: { accountId: string; password: string }) {
        const homeowner = await this.authService.validateHomeowner(body.accountId, body.password);
        if (!homeowner) return { message: 'Invalid credentials' };
        return this.authService.loginHomeowner(homeowner);
    }
}