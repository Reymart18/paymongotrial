import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { AdminActivity } from './admin-activity.entity';
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
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        private propertyService: PropertyService,
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
            'balance',
            'username',
            'gmail',
            'telno',
            'celno',
        ];

        for (const field of allowedFields) {
            if (updates[field] === undefined) {
                continue;
            }

            if (field === 'propertySizeSqm' || field === 'balance') {
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
        const previousPassword = account.password;
        const previousPasswordChanged = account.passwordChanged;
        account.password = hashedPassword;
        account.passwordChanged = false;

        await this.propertyRepo.save(account);

        try {
            await this.sendResetCredentialsEmail({
                accountId: account.accountId || accountId,
                memberName: account.memberName || 'Member',
                gmail: account.gmail,
                temporaryPassword,
            });
        } catch (err) {
            console.error('Reset member password email error:', err);
            account.password = previousPassword;
            account.passwordChanged = previousPasswordChanged;
            await this.propertyRepo.save(account);
            throw new BadRequestException('Password reset was cancelled because the credentials email could not be sent.');
        }

        return { success: true, emailedTo: account.gmail };
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
        });
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

        for (const [accountId, accountBillings] of billingsByAccount) {
            if (accountBillings.length === 0) {
                continue;
            }

            const latestBilling = accountBillings[0];

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

            const amountDue = carryingBalance + currentCharges - membershipPayments;
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
            const notGoodStandingThreshold = currentPrincipal * 2;
            if (amountDueCents > 0 && amountDue >= notGoodStandingThreshold && noRecentPayments) {
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

        const accountIdList = Array.from(accountIds);
        const accounts = accountIdList.length
            ? await this.propertyRepo.find({ where: { accountId: In(accountIdList) } })
            : [];
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

        for (const [accountId, accountBillings] of billingsByAccount) {
            if (accountBillings.length === 0) {
                continue;
            }

            const latestBilling = accountBillings[0];
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

            const amountDue = carryingBalance + currentCharges - membershipPayments;
            if (toCents(amountDue) !== 0) {
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

        const accountIdList = Array.from(accountIds);
        const accounts = accountIdList.length
            ? await this.propertyRepo.find({ where: { accountId: In(accountIdList) } })
            : [];
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

        for (const [accountId, accountBillings] of billingsByAccount) {
            if (accountBillings.length === 0) {
                continue;
            }

            const latestBilling = accountBillings[0];
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

            const amountDue = carryingBalance + currentCharges - membershipPayments;
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

        const accountIdList = Array.from(accountIds);
        const accounts = accountIdList.length
            ? await this.propertyRepo.find({ where: { accountId: In(accountIdList) } })
            : [];
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

        for (const [accountId, accountBillings] of billingsByAccount) {
            if (accountBillings.length === 0) {
                continue;
            }

            const latestBilling = accountBillings[0];
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

            const amountDue = carryingBalance + currentCharges - membershipPayments;
            if (toCents(amountDue) <= 0) {
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

        const accountIdList = Array.from(accountIds);
        const accounts = accountIdList.length
            ? await this.propertyRepo.find({ where: { accountId: In(accountIdList) } })
            : [];
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

        for (const [accountId, accountBillings] of billingsByAccount) {
            if (accountBillings.length === 0) {
                continue;
            }

            const latestBilling = accountBillings[0];
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

            const amountDue = carryingBalance + currentCharges - membershipPayments;
            const threshold = currentPrincipal * 2;
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
