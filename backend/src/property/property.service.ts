import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PropertyAccount } from './property.entity';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';

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

        const account = await this.propertyRepo.findOne({ where: { accountId } });
        const amountDue = Number(account?.balance ?? 0);

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

        if (newPassword.trim().length < 8) {
            throw new BadRequestException('New password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        account.passwordChanged = true;
        await this.propertyRepo.save(account);
    }

}
