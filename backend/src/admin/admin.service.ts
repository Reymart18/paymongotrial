import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { AdminActivity } from './admin-activity.entity';
import { MemberInvitationBatch } from './member-invitation-batch.entity';
import { PropertyAccount } from '../property/property.entity';
import { PropertyService } from '../property/property.service';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Admin)
        private adminRepo: Repository<Admin>,
        @InjectRepository(AdminActivity)
        private activityRepo: Repository<AdminActivity>,
        @InjectRepository(MemberInvitationBatch)
        private invitationBatchRepo: Repository<MemberInvitationBatch>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        private propertyService: PropertyService,
        private dataSource: DataSource,
    ) { }

    async logActivity(input: {
        actorId?: number;
        actorUsername?: string;
        action: string;
        targetType?: string | null;
        targetId?: string | null;
        details?: string | null;
    }): Promise<AdminActivity | null> {
        // Skip logging for bulk uploads and sync operations per request
        const ignoredActions = new Set([
            'upload_billings',
            'upload_payments',
            'sync_payments_dbf',
            'sync_billings_dbf',
            'sync_members_dbf',
        ]);

        if (ignoredActions.has(input.action)) {
            return null;
        }

        const activity = this.activityRepo.create({
            actorId: input.actorId ?? null,
            actorUsername: input.actorUsername ?? null,
            action: input.action,
            targetType: input.targetType ?? null,
            targetId: input.targetId ?? null,
            details: input.details ?? null,
        });

        return this.activityRepo.save(activity);
    }

    async getRecentActivities(limit?: number, page?: number): Promise<{
        items: AdminActivity[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }> {
        const resolvedLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit as number) : 6, 1), 50);
        const resolvedPage = Math.max(Number.isFinite(page) ? Math.floor(page as number) : 1, 1);
        const [items, total] = await this.activityRepo.findAndCount({
            order: { createdAt: 'DESC' },
            take: resolvedLimit,
            skip: (resolvedPage - 1) * resolvedLimit,
        });

        return {
            items,
            page: resolvedPage,
            limit: resolvedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / resolvedLimit), 1),
        };
    }

    async createAdmin(username: string, password: string, fullName: string, role: string = 'admin'): Promise<Admin> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = this.adminRepo.create({
            username,
            password: hashedPassword,
            fullName,
            role,
            passwordChanged: false,
        });
        return this.adminRepo.save(admin);
    }

    async getAllAdmins(): Promise<Admin[]> {
        return this.adminRepo.find({ where: { hiddenFromPortal: false } });
    }

    async getAdminById(id: number): Promise<Admin | null> {
        return this.adminRepo.findOne({ where: { id } });
    }

    async deleteAdmin(id: number): Promise<{ deleted: boolean }> {
        const result = await this.adminRepo.delete({ id });
        if (!result.affected) {
            throw new NotFoundException('Admin not found');
        }

        return { deleted: true };
    }

    async resetAdminPassword(id: number, newPassword: string): Promise<Admin> {
        const admin = await this.adminRepo.findOne({ where: { id } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        admin.passwordChanged = false;
        return this.adminRepo.save(admin);
    }

    async changePassword(id: number, oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
        const admin = await this.adminRepo.findOne({ where: { id } });
        if (!admin || !admin.password) {
            throw new NotFoundException('Admin not found');
        }

        const passwordMatches = await bcrypt.compare(oldPassword, admin.password);
        if (!passwordMatches) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        admin.passwordChanged = true;
        await this.adminRepo.save(admin);

        return { success: true };
    }

    async getAllPropertyAccounts() {
        const accounts = await this.propertyRepo.find();
        return this.propertyService.attachGoodStandingStatus(accounts);
    }

    async updatePropertyAccount(
        accountId: string,
        updates: Partial<PropertyAccount>,
    ): Promise<PropertyAccount> {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const allowedFields: Array<keyof PropertyAccount> = [
            'memberName',
            'propertySizeSqm',
            'classification',
            'username',
            'gmail',
            'telno',
            'celno',
        ];

        for (const field of allowedFields) {
            if (updates[field] === undefined) {
                continue;
            }

            if (field === 'propertySizeSqm') {
                const numericValue = Number(updates[field]);
                if (Number.isNaN(numericValue)) {
                    throw new BadRequestException(`Invalid ${field}`);
                }
                account[field] = numericValue as any;
                continue;
            }

            account[field] = updates[field] as any;
        }

        return this.propertyRepo.save(account);
    }

    async deletePropertyAccount(accountId: string): Promise<{ deleted: boolean }> {
        const result = await this.propertyRepo.delete({ accountId });
        if (!result.affected) {
            throw new NotFoundException('Account not found');
        }

        return { deleted: true };
    }

    async resetPropertyAccountPassword(accountId: string): Promise<{ success: boolean; emailedTo: string }> {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        if (!account.gmail) {
            throw new BadRequestException('Gmail is not set for this account. Sync or update the member Gmail first.');
        }

        const temporaryPassword = randomBytes(6).toString('hex');
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        try {
            await this.sendResetCredentialsEmail({
                accountId: account.accountId || accountId,
                memberName: account.memberName || 'Member',
                gmail: account.gmail,
                temporaryPassword,
            });
        } catch (err) {
            console.error('Reset member password email error:', err);
            throw new BadRequestException('Password reset was cancelled because the credentials email could not be sent.');
        }

        account.password = hashedPassword;
        account.passwordChanged = false;
        account.portalAccessEnabled = true;
        account.invitationStatus = 'sent';
        account.invitationAttemptedAt = new Date();
        account.invitationSentAt = new Date();
        account.invitationError = null;
        account.invitationBatchId = null;
        await this.propertyRepo.save(account);

        return { success: true, emailedTo: account.gmail };
    }

    async getInvitationSummary() {
        const rows = await this.propertyRepo
            .createQueryBuilder('account')
            .select('account.invitation_status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('account.invitation_status')
            .getRawMany<{ status: string; count: string }>();
        const countByStatus = new Map(rows.map((row) => [row.status, Number(row.count || 0)]));
        const [gmailMissing, active, latestBatches] = await Promise.all([
            this.propertyRepo.createQueryBuilder('account')
                .where("account.gmail IS NULL OR TRIM(account.gmail) = ''")
                .getCount(),
            this.propertyRepo.count({ where: { portalAccessEnabled: true } }),
            this.invitationBatchRepo.find({ order: { id: 'DESC' }, take: 1 }),
        ]);
        const latestBatch = latestBatches[0] || null;

        return {
            pending: countByStatus.get('pending') || 0,
            processing: countByStatus.get('processing') || 0,
            sent: countByStatus.get('sent') || 0,
            failed: countByStatus.get('failed') || 0,
            gmailMissing,
            portalActive: active,
            latestBatch: latestBatch ? this.toInvitationBatchResult(latestBatch) : null,
        };
    }

    async createNextInvitationBatch(requestedBy: string, batchSize = 50) {
        return this.createInvitationBatch(requestedBy, batchSize, 'pending');
    }

    async createFailedInvitationBatch(requestedBy: string, batchSize = 100) {
        return this.createInvitationBatch(requestedBy, batchSize, 'failed');
    }

    private async createInvitationBatch(
        requestedBy: string,
        batchSize: number,
        invitationStatus: 'pending' | 'failed',
    ) {
        const resolvedSize = Math.min(Math.max(Math.floor(Number(batchSize) || 50), 1), 100);
        const batch = await this.dataSource.transaction(async (manager) => {
            const batchRepo = manager.getRepository(MemberInvitationBatch);
            const accountRepo = manager.getRepository(PropertyAccount);
            const activeBatch = await batchRepo.findOne({
                where: { status: In(['pending', 'processing']) },
                order: { id: 'DESC' },
            });
            if (activeBatch) {
                throw new BadRequestException('An invitation batch is already running. Wait for it to finish before starting another batch.');
            }

            const accounts = await accountRepo
                .createQueryBuilder('account')
                .setLock('pessimistic_write')
                .where('account.invitation_status = :status', { status: invitationStatus })
                .setParameter('status', invitationStatus)
                .andWhere('account.portal_access_enabled = :access', { access: false })
                .andWhere("account.gmail IS NOT NULL AND TRIM(account.gmail) <> ''")
                .orderBy('account.accountId', 'ASC')
                .take(resolvedSize)
                .getMany();

            if (!accounts.length) {
                throw new BadRequestException('No members are ready to invite.');
            }

            const created = await batchRepo.save(batchRepo.create({
                status: 'pending',
                requestedBy,
                requestedCount: accounts.length,
                sentCount: 0,
                failedCount: 0,
            }));
            for (const account of accounts) {
                account.invitationStatus = 'processing';
                account.invitationAttemptedAt = new Date();
                account.invitationError = null;
                account.invitationBatchId = created.id || null;
            }
            await accountRepo.save(accounts);
            return created;
        });

        setImmediate(() => {
            void this.processInvitationBatch(batch.id || 0);
        });
        return this.toInvitationBatchResult(batch);
    }

    async getInvitationBatch(id: number) {
        const batch = await this.invitationBatchRepo.findOne({ where: { id } });
        if (!batch) {
            throw new NotFoundException('Invitation batch not found.');
        }
        return this.toInvitationBatchResult(batch);
    }

    private async processInvitationBatch(batchId: number) {
        const batch = await this.invitationBatchRepo.findOne({ where: { id: batchId } });
        if (!batch || batch.status === 'completed') return;

        batch.status = 'processing';
        batch.startedAt = new Date();
        await this.invitationBatchRepo.save(batch);

        const accounts = await this.propertyRepo.find({
            where: { invitationBatchId: batchId, invitationStatus: 'processing' },
            order: { accountId: 'ASC' },
        });
        const invitationIntervalMs = 10_000;
        let lastInvitationAttemptAt = 0;

        for (const account of accounts) {
            const gmail = account.gmail?.trim();
            if (!gmail) {
                account.portalAccessEnabled = false;
                account.invitationStatus = 'not_eligible';
                account.invitationError = 'Gmail is not set for this account.';
                account.invitationBatchId = null;
                await this.propertyRepo.save(account);
                batch.failedCount = Number(batch.failedCount || 0) + 1;
                await this.invitationBatchRepo.save(batch);
                continue;
            }

            const temporaryPassword = randomBytes(6).toString('hex');
            try {
                const elapsedSinceLastAttempt = Date.now() - lastInvitationAttemptAt;
                const waitMs = Math.max(0, invitationIntervalMs - elapsedSinceLastAttempt);
                if (lastInvitationAttemptAt > 0 && waitMs > 0) {
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
                }
                lastInvitationAttemptAt = Date.now();
                await this.sendInvitationCredentialsEmail({
                    accountId: account.accountId || '',
                    memberName: account.memberName || 'Member',
                    gmail,
                    temporaryPassword,
                });
                account.password = await bcrypt.hash(temporaryPassword, 10);
                account.passwordChanged = false;
                account.portalAccessEnabled = true;
                account.invitationStatus = 'sent';
                account.invitationSentAt = new Date();
                account.invitationError = null;
                account.invitationBatchId = null;
                await this.propertyRepo.save(account);
                batch.sentCount = Number(batch.sentCount || 0) + 1;
            } catch (error) {
                account.portalAccessEnabled = false;
                account.invitationStatus = 'failed';
                account.invitationError = this.getInvitationError(error);
                account.invitationBatchId = null;
                await this.propertyRepo.save(account);
                batch.failedCount = Number(batch.failedCount || 0) + 1;
                console.error(`Member invitation email error for ${account.accountId}:`, error);
            }
            await this.invitationBatchRepo.save(batch);
        }

        batch.status = 'completed';
        batch.completedAt = new Date();
        await this.invitationBatchRepo.save(batch);
    }

    private toInvitationBatchResult(batch: MemberInvitationBatch) {
        return {
            id: batch.id,
            status: batch.status,
            requestedCount: Number(batch.requestedCount || 0),
            sentCount: Number(batch.sentCount || 0),
            failedCount: Number(batch.failedCount || 0),
            startedAt: batch.startedAt || null,
            completedAt: batch.completedAt || null,
        };
    }

    private getInvitationError(error: unknown): string {
        const message = error instanceof Error ? error.message : String(error);
        return message.slice(0, 1000) || 'Invitation email could not be sent.';
    }

    private getMailer() {
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT || 465);
        const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';

        if (!user || !pass) {
            throw new BadRequestException('Email service is not configured.');
        }

        const options: SMTPTransport.Options & { family?: number } = {
            host,
            port,
            secure,
            auth: { user, pass },
        };
        if (process.env.SMTP_REQUIRE_TLS === 'true') options.requireTLS = true;
        if (process.env.SMTP_FORCE_IPV4 === 'true') options.family = 4;
        return nodemailer.createTransport(options);
    }

    private async sendResetCredentialsEmail(credentials: {
        accountId: string;
        memberName: string;
        gmail: string;
        temporaryPassword: string;
    }) {
        const transporter = this.getMailer();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

        await transporter.sendMail({
            from,
            to: credentials.gmail,
            subject: 'Your HOA Portal Password Has Been Reset',
            text: [
                `Hello ${credentials.memberName},`,
                '',
                'Your HOA Portal password has been reset by the HOA office.',
                '',
                `Portal link: ${this.getPortalUrl()}`,
                `Username / Account ID: ${credentials.accountId}`,
                `Temporary password: ${credentials.temporaryPassword}`,
                '',
                'Please log in and change your password immediately.',
            ].join('\n'),
            html: this.buildCredentialsEmailHtml(
                credentials,
                'Your HOA Portal password has been reset by the HOA office.',
            ),
        });
    }

    private async sendInvitationCredentialsEmail(credentials: {
        accountId: string;
        memberName: string;
        gmail: string;
        temporaryPassword: string;
    }) {
        const transporter = this.getMailer();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

        await transporter.sendMail({
            from,
            to: credentials.gmail,
            subject: 'Your HOA Portal Account Credentials',
            text: [
                `Hello ${credentials.memberName},`,
                '',
                'Your HOA Portal account is ready to use.',
                '',
                `Portal link: ${this.getPortalUrl()}`,
                `Username / Account ID: ${credentials.accountId}`,
                `Temporary password: ${credentials.temporaryPassword}`,
                '',
                'Please log in and change your password immediately.',
            ].join('\n'),
            html: this.buildCredentialsEmailHtml(
                credentials,
                'Your HOA Portal account is ready to use.',
            ),
        });
    }

    private buildCredentialsEmailHtml(
        credentials: { accountId: string; memberName: string; temporaryPassword: string },
        message: string,
    ): string {
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
        <p style="margin:0 0 18px;font-size:16px">Hello ${escape(credentials.memberName || 'Member')},</p>
        <p style="margin:0 0 22px;font-size:16px;line-height:24px">${escape(message)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><tr><td style="padding:16px;font-size:14px;line-height:23px">
          <strong>Portal link:</strong> <a href="${escape(portalUrl)}" style="color:#8c4100">${escape(portalUrl)}</a><br>
          <strong>Username / Account ID:</strong> ${escape(credentials.accountId)}<br>
          <strong>Temporary password:</strong> ${escape(credentials.temporaryPassword)}
        </td></tr></table>
        <p style="margin:0;font-size:14px;line-height:22px;color:#475569">Please log in and change your password immediately.</p>
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

    async getDashboardSummary(): Promise<{
        currentBillingLabel: string;
        unpaidAccountsCount: number;
        overpaidAccountsCount: number;
        settledAccountsCount: number;
        notGoodStandingCount: number;
        totalCollectedPayments: number;
    }> {
        const [accounts, billings, payments] = await Promise.all([
            this.propertyRepo.find(),
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const toCents = (value: unknown) => Math.round(Number(value || 0) * 100);

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const formatDate = (value: unknown) => {
            const date = value instanceof Date ? value : parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';

        let unpaidAccountsCount = 0;
        let overpaidAccountsCount = 0;
        let settledAccountsCount = 0;
        let notGoodStandingCount = 0;

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        const cutoffKey = cutoffDate.toISOString().slice(0, 10);

        const billingsByAccount = new Map<string, FoxproBilling[]>();
        for (const billing of billings) {
            if (!billing.accountId) {
                continue;
            }
            if (!billingsByAccount.has(billing.accountId)) {
                billingsByAccount.set(billing.accountId, []);
            }
            billingsByAccount.get(billing.accountId)?.push(billing);
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }
            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const accountsByAccountId = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        for (const account of accounts) {
            const accountId = account.accountId || '';
            if (!accountId) {
                continue;
            }
            const latestBilling = billingsByAccount.get(accountId)?.[0] ?? null;

            // Calculate Amount Due / Excess like SOA preview:
            // (prinBal + intBal + penBal) + (prinCurr + intCurr + penCurr) - membershipDuesPayments
            const principalBalance = Number(latestBilling?.prinBal || 0);
            const interestBalance = Number(latestBilling?.intBal || 0);
            const penaltyBalance = Number(latestBilling?.penBal || 0);
            const carryingBalance = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(latestBilling?.prinCurr || 0);
            const currentInterest = Number(latestBilling?.intCurr || 0);
            const currentPenalty = Number(latestBilling?.penCurr || 0);
            const currentCharges = currentPrincipal + currentInterest + currentPenalty;

            // Calculate membership dues payments within the billing period
            let membershipPayments = 0;
            const billingStart = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
            const billingEnd = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = Number(accountsByAccountId.get(accountId)?.balance ?? 0);
            const amountDueCents = toCents(amountDue);

            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const paycat = String(payment.paycat || '').trim().toLowerCase();
                if (paycat !== 'membership dues') {
                    return latest;
                }

                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);
            const lastPaymentKey = lastPaymentDate ? lastPaymentDate.toISOString().slice(0, 10) : null;
            const noRecentPayments = !lastPaymentKey || lastPaymentKey <= cutoffKey;
            const notGoodStandingThreshold = currentPrincipal * 4;
            if (currentPrincipal > 0 && amountDueCents > 0 && amountDue >= notGoodStandingThreshold && noRecentPayments) {
                notGoodStandingCount += 1;
            }

            if (amountDueCents > 0) {
                unpaidAccountsCount += 1;
            } else if (amountDueCents < 0) {
                overpaidAccountsCount += 1;
            } else {
                settledAccountsCount += 1;
            }
        }

        let totalCollectedPayments = 0;
        if (latestPeriod?.fromKey && latestPeriod?.toKey) {
            for (const payment of payments) {
                const paymentKey = dateKey(payment?.paymentDate);
                if (!paymentKey) {
                    continue;
                }

                if (paymentKey >= latestPeriod.fromKey && paymentKey <= latestPeriod.toKey) {
                    totalCollectedPayments += Number(payment?.amountPaid || 0);
                }
            }
        }

        return {
            currentBillingLabel,
            unpaidAccountsCount,
            overpaidAccountsCount,
            settledAccountsCount,
            notGoodStandingCount,
            totalCollectedPayments,
        };
    }

    async getPaymentsCollectionReport(): Promise<{
        currentBillingLabel: string;
        billingStartKey: string | null;
        billingEndKey: string | null;
        items: Array<{
            paycat: string;
            count: number;
            total: number;
        }>;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const formatDate = (value: unknown) => {
            const date = value instanceof Date ? value : parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';

        const byPaycat = new Map<string, { paycat: string; count: number; total: number }>();

        if (latestPeriod?.fromKey && latestPeriod?.toKey) {
            for (const payment of payments) {
                const paymentKey = dateKey(payment?.paymentDate);
                if (!paymentKey) {
                    continue;
                }

                if (paymentKey < latestPeriod.fromKey || paymentKey > latestPeriod.toKey) {
                    continue;
                }

                const rawPaycat = String(payment?.paycat || '').trim();
                const paycat = rawPaycat || 'Uncategorized';
                const current = byPaycat.get(paycat) || { paycat, count: 0, total: 0 };
                current.count += 1;
                current.total += Number(payment?.amountPaid || 0);
                byPaycat.set(paycat, current);
            }
        }

        const items = Array.from(byPaycat.values()).sort((a, b) => b.total - a.total);

        return {
            currentBillingLabel,
            billingStartKey: latestPeriod?.fromKey || null,
            billingEndKey: latestPeriod?.toKey || null,
            items,
        };
    }

    async getPaymentsByCategoryReport(paycat: string): Promise<{
        currentBillingLabel: string;
        billingStartKey: string | null;
        billingEndKey: string | null;
        paycat: string;
        items: Array<{
            accountId: string | null;
            memberName: string | null;
            paymentDate: Date | null;
            amountPaid: number;
            description: string | null;
            referenceNumber: string | null;
            paycat: string | null;
        }>;
    }> {
        const normalizedInput = String(paycat || '').trim();
        if (!normalizedInput) {
            throw new BadRequestException('Pay category is required');
        }

        const normalizedKey = normalizedInput.toLowerCase();

        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const formatDate = (value: unknown) => {
            const date = parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';

        const matchesPaycat = (value: string | null | undefined) => {
            const raw = String(value || '').trim();
            const key = raw.toLowerCase();
            if (normalizedKey === 'uncategorized') {
                return key === '' || key === 'uncategorized';
            }
            return key === normalizedKey;
        };

        const items: Array<{
            accountId: string | null;
            memberName: string | null;
            paymentDate: Date | null;
            amountPaid: number;
            description: string | null;
            referenceNumber: string | null;
            paycat: string | null;
        }> = [];

        const accountIds = new Set<string>();
        for (const payment of payments) {
            if (payment?.accountId) {
                accountIds.add(payment.accountId);
            }
        }

        const accounts = accountIds.size
            ? await this.propertyRepo.find({ where: { accountId: In(Array.from(accountIds)) } })
            : [];
        const accountMap = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        if (latestPeriod?.fromKey && latestPeriod?.toKey) {
            for (const payment of payments) {
                const paymentKey = dateKey(payment?.paymentDate);
                if (!paymentKey) {
                    continue;
                }

                if (paymentKey < latestPeriod.fromKey || paymentKey > latestPeriod.toKey) {
                    continue;
                }

                if (!matchesPaycat(payment?.paycat ?? null)) {
                    continue;
                }

                const account = accountMap.get(payment?.accountId ?? '');

                items.push({
                    accountId: payment?.accountId ?? null,
                    memberName: account?.memberName ?? null,
                    paymentDate: payment?.paymentDate ?? null,
                    amountPaid: Number(payment?.amountPaid || 0),
                    description: payment?.description ?? null,
                    referenceNumber: payment?.referenceNumber ?? null,
                    paycat: payment?.paycat ?? null,
                });
            }
        }

        items.sort((a, b) => {
            const aTime = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const bTime = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            if (bTime !== aTime) {
                return bTime - aTime;
            }
            return String(a.accountId || '').localeCompare(String(b.accountId || ''), 'en', { numeric: true });
        });

        return {
            currentBillingLabel,
            billingStartKey: latestPeriod?.fromKey || null,
            billingEndKey: latestPeriod?.toKey || null,
            paycat: normalizedInput,
            items,
        };
    }

    async getSettledAccountsReport(): Promise<{
        currentBillingLabel: string;
        billingEndDateKey: string | null;
        items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }>;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const formatDate = (value: unknown) => {
            const date = parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        const toCents = (value: unknown) => Math.round(Number(value || 0) * 100);

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';
        const billingEndDateKey = latestPeriod?.toKey ?? null;

        const billingsByAccount = new Map<string, FoxproBilling[]>();
        const accountIds = new Set<string>();
        for (const billing of billings) {
            if (!billing.accountId) {
                continue;
            }
            accountIds.add(billing.accountId);
            if (!billingsByAccount.has(billing.accountId)) {
                billingsByAccount.set(billing.accountId, []);
            }
            billingsByAccount.get(billing.accountId)?.push(billing);
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }
            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const accounts = await this.propertyRepo.find();
        const accountMap = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        const items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }> = [];

        for (const accountEntry of accounts) {
            const accountId = accountEntry.accountId || '';
            if (!accountId) {
                continue;
            }
            const latestBilling = billingsByAccount.get(accountId)?.[0] ?? null;
            const principalBalance = Number(latestBilling?.prinBal || 0);
            const interestBalance = Number(latestBilling?.intBal || 0);
            const penaltyBalance = Number(latestBilling?.penBal || 0);
            const carryingBalance = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(latestBilling?.prinCurr || 0);
            const currentInterest = Number(latestBilling?.intCurr || 0);
            const currentPenalty = Number(latestBilling?.penCurr || 0);
            const currentCharges = currentPrincipal + currentInterest + currentPenalty;

            let membershipPayments = 0;
            const billingStart = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
            const billingEnd = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = Number(accountMap.get(accountId)?.balance ?? 0);
            if (toCents(amountDue) !== 0) {
                continue;
            }

            const account = accountMap.get(accountId);
            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const paycat = String(payment.paycat || '').trim().toLowerCase();
                if (paycat !== 'membership dues') {
                    return latest;
                }

                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);

            items.push({
                accountId,
                memberName: account?.memberName ?? '-',
                classification: account?.classification ?? null,
                neighborhood: account?.neighborhood ?? '-',
                block: account?.block ?? '-',
                lot: account?.lot ?? '-',
                amountDue,
                lastPaymentDate,
            });
        }

        items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true }));

        return {
            currentBillingLabel,
            billingEndDateKey,
            items,
        };
    }

    async getOverpaidAccountsReport(): Promise<{
        currentBillingLabel: string;
        billingEndDateKey: string | null;
        items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }>;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const formatDate = (value: unknown) => {
            const date = parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        const toCents = (value: unknown) => Math.round(Number(value || 0) * 100);

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';
        const billingEndDateKey = latestPeriod?.toKey ?? null;

        const billingsByAccount = new Map<string, FoxproBilling[]>();
        const accountIds = new Set<string>();
        for (const billing of billings) {
            if (!billing.accountId) {
                continue;
            }
            accountIds.add(billing.accountId);
            if (!billingsByAccount.has(billing.accountId)) {
                billingsByAccount.set(billing.accountId, []);
            }
            billingsByAccount.get(billing.accountId)?.push(billing);
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }
            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const accounts = await this.propertyRepo.find();
        const accountMap = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        const items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }> = [];

        for (const accountEntry of accounts) {
            const accountId = accountEntry.accountId || '';
            if (!accountId) {
                continue;
            }
            const latestBilling = billingsByAccount.get(accountId)?.[0] ?? null;
            const principalBalance = Number(latestBilling?.prinBal || 0);
            const interestBalance = Number(latestBilling?.intBal || 0);
            const penaltyBalance = Number(latestBilling?.penBal || 0);
            const carryingBalance = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(latestBilling?.prinCurr || 0);
            const currentInterest = Number(latestBilling?.intCurr || 0);
            const currentPenalty = Number(latestBilling?.penCurr || 0);
            const currentCharges = currentPrincipal + currentInterest + currentPenalty;

            let membershipPayments = 0;
            const billingStart = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
            const billingEnd = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = Number(accountMap.get(accountId)?.balance ?? 0);
            if (toCents(amountDue) >= 0) {
                continue;
            }

            const account = accountMap.get(accountId);
            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);

            items.push({
                accountId,
                memberName: account?.memberName ?? '-',
                classification: account?.classification ?? null,
                neighborhood: account?.neighborhood ?? '-',
                block: account?.block ?? '-',
                lot: account?.lot ?? '-',
                amountDue,
                lastPaymentDate,
            });
        }

        items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true }));

        return {
            currentBillingLabel,
            billingEndDateKey,
            items,
        };
    }

    async getUnpaidAccountsReport(): Promise<{
        currentBillingLabel: string;
        billingEndDateKey: string | null;
        items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            gmail: string | null;
            telno: string | null;
            celno: string | null;
            amountDue: number;
            lastPaymentDate: Date | null;
        }>;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const formatDate = (value: unknown) => {
            const date = parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        const toCents = (value: unknown) => Math.round(Number(value || 0) * 100);

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';
        const billingEndDateKey = latestPeriod?.toKey ?? null;

        const billingsByAccount = new Map<string, FoxproBilling[]>();
        const accountIds = new Set<string>();
        for (const billing of billings) {
            if (!billing.accountId) {
                continue;
            }
            accountIds.add(billing.accountId);
            if (!billingsByAccount.has(billing.accountId)) {
                billingsByAccount.set(billing.accountId, []);
            }
            billingsByAccount.get(billing.accountId)?.push(billing);
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }
            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const accounts = await this.propertyRepo.find();
        const accountMap = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        const items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            gmail: string | null;
            telno: string | null;
            celno: string | null;
            amountDue: number;
            lastPaymentDate: Date | null;
        }> = [];

        for (const accountEntry of accounts) {
            const accountId = accountEntry.accountId || '';
            if (!accountId) {
                continue;
            }
            const latestBilling = billingsByAccount.get(accountId)?.[0] ?? null;
            const principalBalance = Number(latestBilling?.prinBal || 0);
            const interestBalance = Number(latestBilling?.intBal || 0);
            const penaltyBalance = Number(latestBilling?.penBal || 0);
            const carryingBalance = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(latestBilling?.prinCurr || 0);
            const currentInterest = Number(latestBilling?.intCurr || 0);
            const currentPenalty = Number(latestBilling?.penCurr || 0);
            const currentCharges = currentPrincipal + currentInterest + currentPenalty;

            let membershipPayments = 0;
            const billingStart = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
            const billingEnd = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = Number(accountMap.get(accountId)?.balance ?? 0);
            if (toCents(amountDue) <= 0) {
                continue;
            }

            const account = accountMap.get(accountId);
            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastMembershipDuesPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const paycat = String(payment.paycat || '').trim().toLowerCase();
                if (paycat !== 'membership dues') {
                    return latest;
                }

                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);

            items.push({
                accountId,
                memberName: account?.memberName ?? '-',
                classification: account?.classification ?? null,
                neighborhood: account?.neighborhood ?? '-',
                block: account?.block ?? '-',
                lot: account?.lot ?? '-',
                gmail: account?.gmail ?? null,
                telno: account?.telno ?? null,
                celno: account?.celno ?? null,
                amountDue,
                lastPaymentDate: lastMembershipDuesPaymentDate,
            });
        }

        items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true }));

        return {
            currentBillingLabel,
            billingEndDateKey,
            items,
        };
    }

    async getNotGoodStandingReport(status?: string): Promise<{
        currentBillingLabel: string;
        billingEndDateKey: string | null;
        items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }>;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const formatDate = (value: unknown) => {
            const date = parseDate(value);
            return date ? date.toLocaleDateString() : '-';
        };

        const formatKey = (key: string | null) => {
            if (!key) {
                return '-';
            }
            const date = new Date(`${key}T00:00:00.000Z`);
            return formatDate(date);
        };

        let latestPeriod: { fromKey: string | null; toKey: string } | null = null;
        for (const row of billings) {
            const toKey = dateKey(row?.dateTo) || dateKey(row?.dateFrom);
            if (!toKey) {
                continue;
            }

            latestPeriod = {
                fromKey: dateKey(row?.dateFrom) || toKey,
                toKey,
            };
            break;
        }

        const currentBillingLabel = latestPeriod?.fromKey && latestPeriod?.toKey
            ? `${formatKey(latestPeriod.fromKey)} - ${formatKey(latestPeriod.toKey)}`
            : latestPeriod?.toKey
                ? formatKey(latestPeriod.toKey)
                : '-';
        const billingEndDateKey = latestPeriod?.toKey ?? null;

        const billingsByAccount = new Map<string, FoxproBilling[]>();
        const accountIds = new Set<string>();
        for (const billing of billings) {
            if (!billing.accountId) {
                continue;
            }
            accountIds.add(billing.accountId);
            if (!billingsByAccount.has(billing.accountId)) {
                billingsByAccount.set(billing.accountId, []);
            }
            billingsByAccount.get(billing.accountId)?.push(billing);
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }
            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const accounts = await this.propertyRepo.find();
        const accountMap = new Map(
            accounts.map((account) => [account.accountId ?? '', account]),
        );

        const normalizedStatus = status?.toLowerCase() === 'good' ? 'good' : 'not';
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        const cutoffKey = cutoffDate.toISOString().slice(0, 10);

        const items: Array<{
            accountId: string;
            memberName: string;
            classification: string | null;
            neighborhood: string;
            block: string;
            lot: string;
            amountDue: number;
            lastPaymentDate: Date | null;
        }> = [];

        for (const accountEntry of accounts) {
            const accountId = accountEntry.accountId || '';
            if (!accountId) {
                continue;
            }
            const latestBilling = billingsByAccount.get(accountId)?.[0] ?? null;
            const principalBalance = Number(latestBilling?.prinBal || 0);
            const interestBalance = Number(latestBilling?.intBal || 0);
            const penaltyBalance = Number(latestBilling?.penBal || 0);
            const carryingBalance = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(latestBilling?.prinCurr || 0);
            const currentInterest = Number(latestBilling?.intCurr || 0);
            const currentPenalty = Number(latestBilling?.penCurr || 0);
            const currentCharges = currentPrincipal + currentInterest + currentPenalty;

            if (currentPrincipal <= 0) {
                continue;
            }

            let membershipPayments = 0;
            const billingStart = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
            const billingEnd = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = Number(accountMap.get(accountId)?.balance ?? 0);
            const threshold = currentPrincipal * 4;
            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastMembershipPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const paycat = String(payment.paycat || '').trim().toLowerCase();
                if (paycat !== 'membership dues') {
                    return latest;
                }

                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);
            const lastPaymentKey = lastMembershipPaymentDate
                ? lastMembershipPaymentDate.toISOString().slice(0, 10)
                : null;
            const isNotGoodStanding = amountDue >= threshold;

            if (normalizedStatus === 'good') {
                if (!(amountDue < threshold)) {
                    continue;
                }
            } else if (!isNotGoodStanding) {
                continue;
            }

            const account = accountMap.get(accountId);

            items.push({
                accountId,
                memberName: account?.memberName ?? '-',
                classification: account?.classification ?? null,
                neighborhood: account?.neighborhood ?? '-',
                block: account?.block ?? '-',
                lot: account?.lot ?? '-',
                amountDue,
                lastPaymentDate: lastMembershipPaymentDate,
            });
        }

        items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true }));

        return {
            currentBillingLabel,
            billingEndDateKey,
            items,
        };
    }
}
