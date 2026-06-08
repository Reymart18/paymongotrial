import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PropertyAccount } from './property.entity';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';

export interface CreateHomeownerInput {
    neighborhood: string;
    block: string;
    lot: string;
    memberName: string;
    propertySizeSqm: number;
    classification: string;
    username: string;
    password: string;
}

@Injectable()
export class PropertyService {
    private static readonly GOOD_STANDING = 'In Good Standing';
    private static readonly NOT_GOOD_STANDING = 'Not in Good Standing';

    constructor(
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        private dataSource: DataSource,
    ) { }

    async createHomeowner(input: CreateHomeownerInput): Promise<PropertyAccount> {
        const accountId = `${input.neighborhood}${input.block}${input.lot}`;
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const passwordChanged = input.password !== accountId;

        const homeowner = this.propertyRepo.create({
            accountId,
            neighborhood: input.neighborhood,
            block: input.block,
            lot: input.lot,
            memberName: input.memberName,
            propertySizeSqm: input.propertySizeSqm,
            classification: input.classification,
            username: input.username,
            password: hashedPassword,
            passwordChanged,
            balance: 0,
        });

        return this.propertyRepo.save(homeowner);
    }

    async getByAccountId(accountId: string): Promise<PropertyAccount | null> {
        return this.propertyRepo.findOne({ where: { accountId } });
    }

    async getGoodStandingStatus(accountId: string): Promise<string> {
        if (!accountId) {
            return PropertyService.GOOD_STANDING;
        }

        const latestBilling = await this.billingRepo.findOne({
            where: { accountId },
            order: { dueDate: 'DESC' },
        });

        if (!latestBilling) {
            return PropertyService.GOOD_STANDING;
        }

        const currentCharges =
            Number(latestBilling.prinCurr || 0) +
            Number(latestBilling.intCurr || 0) +
            Number(latestBilling.penCurr || 0);

        const carryingBalance =
            Number(latestBilling.prinBal || 0) +
            Number(latestBilling.intBal || 0) +
            Number(latestBilling.penBal || 0);

        const startDate = latestBilling.dateFrom ? new Date(latestBilling.dateFrom) : null;
        const endDate = latestBilling.dateTo ? new Date(latestBilling.dateTo) : null;
        const hasValidRange =
            startDate &&
            endDate &&
            !Number.isNaN(startDate.getTime()) &&
            !Number.isNaN(endDate.getTime());

        let paidTotal = 0;
        if (hasValidRange) {
            const raw = await this.paymentRepo
                .createQueryBuilder('payment')
                .select('COALESCE(SUM(payment.amountPaid), 0)', 'totalPaid')
                .where('payment.accountId = :accountId', { accountId })
                .andWhere('payment.paymentDate BETWEEN :start AND :end', {
                    start: startDate,
                    end: endDate,
                })
                .andWhere('LOWER(TRIM(payment.paycat)) = :paycat', { paycat: 'membership dues' })
                .getRawOne();

            paidTotal = Number(raw?.totalPaid ?? 0);
        }

        const amountDue = carryingBalance + currentCharges - paidTotal;

        if (currentCharges <= 0) {
            return PropertyService.GOOD_STANDING;
        }

        return amountDue >= currentCharges * 2
            ? PropertyService.NOT_GOOD_STANDING
            : PropertyService.GOOD_STANDING;
    }

    async attachGoodStandingStatus(accounts: PropertyAccount[]) {
        const enriched = await Promise.all(
            accounts.map(async (account) => {
                if (!account.accountId) {
                    return { ...account, goodStandingStatus: PropertyService.GOOD_STANDING };
                }

                const goodStandingStatus = await this.getGoodStandingStatus(account.accountId);
                return { ...account, goodStandingStatus };
            }),
        );

        return enriched;
    }

    async changePassword(
        accountId: number,
        oldPassword: string,
        newPassword: string,
    ): Promise<void> {
        const account = await this.propertyRepo.findOne({ where: { id: accountId } });
        if (!account || !account.password) {
            throw new BadRequestException('Account not found');
        }

        const matches = await bcrypt.compare(oldPassword, account.password);
        if (!matches) {
            throw new BadRequestException('Current password is incorrect');
        }

        if (newPassword.trim().length < 6) {
            throw new BadRequestException('New password must be at least 6 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        account.passwordChanged = true;
        await this.propertyRepo.save(account);
    }

    async recalculateBalances(): Promise<{ updated: number }> {
        return this.dataSource.transaction(async (manager) => {
            const propertyRepo = manager.getRepository(PropertyAccount);
            const billingRepo = manager.getRepository(FoxproBilling);
            const paymentRepo = manager.getRepository(FoxproPayment);

            const billingSums = await billingRepo
                .createQueryBuilder('billing')
                .select('billing.accountId', 'accountId')
                .addSelect('SUM(billing.prinBal)', 'totalPriorDue')
                .addSelect('SUM(billing.intBal)', 'totalPriorInterest')
                .addSelect('SUM(billing.penBal)', 'totalPriorPenalty')
                .addSelect('SUM(billing.prinCurr)', 'totalDue')
                .addSelect('SUM(billing.intCurr)', 'totalInterest')
                .addSelect('SUM(billing.penCurr)', 'totalPenalty')
                .groupBy('billing.accountId')
                .getRawMany();

            const paymentSums = await paymentRepo
                .createQueryBuilder('payment')
                .select('payment.accountId', 'accountId')
                .addSelect('SUM(payment.amountPaid)', 'totalPaid')
                .groupBy('payment.accountId')
                .getRawMany();

            const dueMap = new Map<string, number>();
            const interestMap = new Map<string, number>();
            const penaltyMap = new Map<string, number>();
            const priorDueMap = new Map<string, number>();
            const priorInterestMap = new Map<string, number>();
            const priorPenaltyMap = new Map<string, number>();
            for (const row of billingSums) {
                const accountId = String(row.accountId || '').trim();
                if (!accountId) {
                    continue;
                }
                priorDueMap.set(accountId, Number(row.totalPriorDue ?? 0));
                priorInterestMap.set(accountId, Number(row.totalPriorInterest ?? 0));
                priorPenaltyMap.set(accountId, Number(row.totalPriorPenalty ?? 0));
                dueMap.set(accountId, Number(row.totalDue ?? 0));
                interestMap.set(accountId, Number(row.totalInterest ?? 0));
                penaltyMap.set(accountId, Number(row.totalPenalty ?? 0));
            }

            const paidMap = new Map<string, number>();
            for (const row of paymentSums) {
                const accountId = String(row.accountId || '').trim();
                if (!accountId) {
                    continue;
                }
                paidMap.set(accountId, Number(row.totalPaid ?? 0));
            }

            const accounts = await propertyRepo.find();
            for (const account of accounts) {
                const accountId = String(account.accountId || '').trim();
                if (!accountId) {
                    continue;
                }

                const totalDue = dueMap.get(accountId) ?? 0;
                const totalInterest = interestMap.get(accountId) ?? 0;
                const totalPenalty = penaltyMap.get(accountId) ?? 0;
                const totalPriorDue = priorDueMap.get(accountId) ?? 0;
                const totalPriorInterest = priorInterestMap.get(accountId) ?? 0;
                const totalPriorPenalty = priorPenaltyMap.get(accountId) ?? 0;
                const totalPaid = paidMap.get(accountId) ?? 0;
                account.balance =
                    totalPriorDue +
                    totalPriorInterest +
                    totalPriorPenalty +
                    totalDue +
                    totalInterest +
                    totalPenalty -
                    totalPaid;
            }

            if (accounts.length > 0) {
                await propertyRepo.save(accounts);
            }

            return { updated: accounts.length };
        });
    }

}
