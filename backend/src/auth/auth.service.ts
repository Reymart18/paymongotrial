import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admin/admin.entity';
import { PropertyAccount } from '../property/property.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Admin)
        private adminRepo: Repository<Admin>,
        @InjectRepository(PropertyAccount)
        private propertyAccountRepo: Repository<PropertyAccount>,
        private jwtService: JwtService,
    ) { }

    /**
     * Validates admin credentials
     * @param username Admin username
     * @param password Admin password (plain text)
     * @returns Admin object without password, or null if invalid
     */
    async validateAdmin(username: string, password: string): Promise<any> {
        const admin = await this.adminRepo.findOne({ where: { username } });
        if (admin && admin.password && (await bcrypt.compare(password, admin.password))) {
            const { password, ...result } = admin;
            return result;
        }
        return null;
    }

    /**
     * Generates JWT token for admin login
     * @param admin Admin entity
     * @returns Object with access_token
     */
    async login(admin: Admin) {
        const payload = { username: admin.username, sub: admin.id, role: admin.role };
        return {
            access_token: this.jwtService.sign(payload),
            role: admin.role ?? 'admin',
            username: admin.username,
            fullName: admin.fullName,
            requirePasswordChange: admin.passwordChanged === false,
        };
    }

    /**
     * Validates homeowner credentials
     * @param accountId Property account ID
     * @param password Homeowner password (plain text)
     * @returns PropertyAccount object without password, or null if invalid
     */
    async validateHomeowner(accountId: string, password: string): Promise<any> {
        const homeowner = await this.propertyAccountRepo.findOne({ where: { accountId } });
        if (homeowner && homeowner.password && (await bcrypt.compare(password, homeowner.password))) {
            const { password, ...result } = homeowner;
            return result;
        }
        return null;
    }

    private getMailer() {
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT || 465);
        const secure = process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === 'true'
            : port === 465;
        const requireTls = process.env.SMTP_REQUIRE_TLS === 'true';
        const forceIpv4 = process.env.SMTP_FORCE_IPV4 === 'true';
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';

        if (!user || !pass) {
            return null;
        }

        const transportOptions: SMTPTransport.Options & { family?: number } = {
            host,
            port,
            secure,
            auth: { user, pass },
        };

        if (requireTls) {
            transportOptions.requireTLS = true;
        }

        if (forceIpv4) {
            transportOptions.family = 4;
        }

        return nodemailer.createTransport(transportOptions);
    }

    private generateOtp(): string {
        return String(Math.floor(10000000 + Math.random() * 90000000));
    }

    private getOtpCooldownRemaining(lastSentAt?: Date | null): number {
        if (!lastSentAt) {
            return 0;
        }

        const cooldownMs = 3 * 60 * 1000;
        const elapsed = Date.now() - lastSentAt.getTime();
        const remaining = cooldownMs - elapsed;
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    private async sendOtpEmail(to: string, otp: string, accountId: string) {
        const transporter = this.getMailer();
        if (!transporter) {
            throw new BadRequestException('Email service is not configured.');
        }

        const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

        await transporter.sendMail({
            from,
            to,
            subject: 'Your HOA Portal Verification Code',
            text: `Your verification code is ${otp}. This code expires in 5 minutes. Account: ${accountId}.`,
        });
    }

    async startHomeownerLogin(accountId: string, password: string) {
        const homeowner = await this.propertyAccountRepo.findOne({ where: { accountId } });
        if (!homeowner || !homeowner.password || !(await bcrypt.compare(password, homeowner.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (homeowner.passwordChanged) {
            return this.loginHomeowner(homeowner);
        }

        if (!homeowner.gmail) {
            throw new BadRequestException('Gmail is not set for this account. Please contact the HOA office.');
        }

        const cooldownRemaining = this.getOtpCooldownRemaining(homeowner.otpLastSentAt ?? null);
        if (cooldownRemaining > 0) {
            throw new BadRequestException(`Please wait ${cooldownRemaining} seconds before requesting a new code.`);
        }

        const otp = this.generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const otpLastSentAt = new Date();

        await this.propertyAccountRepo.update(
            { id: homeowner.id },
            { otpHash, otpExpiresAt, otpLastSentAt },
        );

        await this.sendOtpEmail(homeowner.gmail, otp, homeowner.accountId || accountId);

        return {
            otpRequired: true,
            gmail: homeowner.gmail,
            expiresIn: 300,
            cooldownSeconds: 180,
        };
    }

    async verifyHomeownerOtp(accountId: string, otp: string) {
        const homeowner = await this.propertyAccountRepo.findOne({ where: { accountId } });
        if (!homeowner || !homeowner.otpHash || !homeowner.otpExpiresAt) {
            throw new UnauthorizedException('Verification code expired. Please log in again.');
        }

        if (new Date() > homeowner.otpExpiresAt) {
            await this.propertyAccountRepo.update(
                { id: homeowner.id },
                { otpHash: null, otpExpiresAt: null },
            );
            throw new UnauthorizedException('Verification code expired. Please log in again.');
        }

        const isValid = await bcrypt.compare(otp, homeowner.otpHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid verification code');
        }

        await this.propertyAccountRepo.update(
            { id: homeowner.id },
            { otpHash: null, otpExpiresAt: null },
        );

        return this.loginHomeowner(homeowner);
    }

    /**
     * Generates JWT token for homeowner login
     * @param homeowner PropertyAccount entity
     * @returns Object with access_token
     */
    async loginHomeowner(homeowner: PropertyAccount) {
        const payload = { username: homeowner.username, sub: homeowner.id, role: 'homeowner' };
        return {
            access_token: this.jwtService.sign(payload),
            requirePasswordChange: !homeowner.passwordChanged,
            accountId: homeowner.accountId,
        };
    }
}
