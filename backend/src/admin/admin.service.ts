import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { AdminActivity } from './admin-activity.entity';
import { PropertyAccount } from '../property/property.entity';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import * as bcrypt from 'bcrypt';

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
    ) { }

    async logActivity(input: {
        actorId?: number;
        actorUsername?: string;
        action: string;
        targetType?: string | null;
        targetId?: string | null;
        details?: string | null;
    }): Promise<AdminActivity> {
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

    async getRecentActivities(limit?: number): Promise<AdminActivity[]> {
        const resolvedLimit = Number.isFinite(limit) ? (limit as number) : 10;
        return this.activityRepo.find({
            order: { createdAt: 'DESC' },
            take: resolvedLimit,
        });
    }

    async createAdmin(username: string, password: string, fullName: string, role: string = 'admin'): Promise<Admin> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = this.adminRepo.create({
            username,
            password: hashedPassword,
            fullName,
            role,
        });
        return this.adminRepo.save(admin);
    }

    async getAllAdmins(): Promise<Admin[]> {
        return this.adminRepo.find();
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
        return this.adminRepo.save(admin);
    }

    async getAllPropertyAccounts(): Promise<PropertyAccount[]> {
        return this.propertyRepo.find();
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
            'status',
            'balance',
            'username',
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

    async resetPropertyAccountPassword(accountId: string, newPassword: string): Promise<PropertyAccount> {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        account.passwordChanged = false;

        return this.propertyRepo.save(account);
    }

    async getDashboardSummary(): Promise<{
        currentBillingLabel: string;
        unpaidAccountsCount: number;
        overpaidAccountsCount: number;
        totalCollectedPayments: number;
    }> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find(),
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

            if (amountDueCents > 0) {
                unpaidAccountsCount += 1;
            } else if (amountDueCents < 0) {
                overpaidAccountsCount += 1;
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
            totalCollectedPayments,
        };
    }
}
