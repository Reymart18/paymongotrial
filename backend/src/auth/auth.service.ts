import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admin/admin.entity';
import { PropertyAccount } from '../property/property.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export const MEMBER_AGREEMENT_VERSION = '2026-09-16';

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
        if (
            homeowner
            && homeowner.portalAccessEnabled !== false
            && homeowner.password
            && (await bcrypt.compare(password, homeowner.password))
        ) {
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

        const cooldownMs = 15 * 60 * 1000;
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
            text: `Your verification code is ${otp}. This code expires in 15 minutes. Account: ${accountId}.`,
            html: this.buildOtpEmailHtml(otp, accountId),
        });
    }

    private buildOtpEmailHtml(otp: string, accountId: string): string {
        const escape = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;',
        }[character] || character));
        const portalUrl = this.getPortalUrl();

        return `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <tr><td align="center" style="padding:26px 24px 18px;background:#fff7ed"><img src="${escape(`${portalUrl}/pvhai.png`)}" alt="Parkplace Village Homeowners Association" width="96" style="display:block;max-width:96px;height:auto"></td></tr>
      <tr><td style="padding:28px 32px">
        <p style="margin:0 0 18px;font-size:16px">Your HOA Portal verification code is:</p>
        <p style="margin:0 0 22px;font-size:30px;font-weight:bold;letter-spacing:5px;color:#8c4100">${escape(otp)}</p>
        <p style="margin:0;font-size:14px;line-height:22px;color:#475569">This code expires in 15 minutes. Account: ${escape(accountId)}.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
    }

    private getPortalUrl(): string {
        const configured = process.env.PORTAL_URL || process.env.FRONTEND_URL;
        if (configured?.trim()) {
            return configured.trim().replace(/\/+$/, '');
        }

        return 'https://parkplacevillage.cloud';
    }

    async startHomeownerLogin(accountId: string, password: string) {
        const homeowner = await this.propertyAccountRepo.findOne({ where: { accountId } });
        if (!homeowner || !homeowner.password || !(await bcrypt.compare(password, homeowner.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (homeowner.portalAccessEnabled === false) {
            throw new BadRequestException('Portal access is not active for this account. Please contact the HOA office.');
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
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const otpLastSentAt = new Date();

        await this.propertyAccountRepo.update(
            { id: homeowner.id },
            { otpHash, otpExpiresAt, otpLastSentAt },
        );

        await this.sendOtpEmail(homeowner.gmail, otp, homeowner.accountId || accountId);

        return {
            otpRequired: true,
            gmail: homeowner.gmail,
            expiresIn: 900,
            cooldownSeconds: 900,
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
        if (homeowner.portalAccessEnabled === false) {
            throw new UnauthorizedException('Portal access is not active for this account.');
        }

        const payload = { username: homeowner.username, sub: homeowner.id, role: 'homeowner' };
        return {
            access_token: this.jwtService.sign(payload),
            requirePasswordChange: !homeowner.passwordChanged,
            requireMemberAgreement: homeowner.memberAgreementVersion !== MEMBER_AGREEMENT_VERSION,
            accountId: homeowner.accountId,
        };
    }
}
