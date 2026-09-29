import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { MEMBER_AGREEMENT_VERSION } from '../auth/auth.service';
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

    async uploadSoaNumbers(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        const result = {
            updated: 0,
            skipped: 0,
            errors: [] as string[],
        };

        await this.dataSource.transaction(async (manager) => {
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < rows.length; index += 1) {
                const row = index + 2;
                const normalized = this.normalizeSoaUploadRow(rows[index]);
                const accountId = this.buildSoaAccountId(
                    normalized.neighborhood,
                    normalized.block,
                    normalized.lot,
                );

                if (!accountId || normalized.soa === '') {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing neighborhood, block, lot, or SOA`);
                    continue;
                }

                const soa = Number(normalized.soa);
                if (!Number.isFinite(soa) || soa < 0) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid SOA value (${normalized.soa})`);
                    continue;
                }

                const account = await propertyRepo.findOne({ where: { accountId } });
                if (!account) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Account not found (${accountId})`);
                    continue;
                }

                const normalizedSoa = Math.round(soa * 100) / 100;
                if (Number(account.soa ?? 0) === normalizedSoa) {
                    result.skipped += 1;
                    continue;
                }

                account.soa = normalizedSoa;
                await propertyRepo.save(account);
                result.updated += 1;
            }
        });

        return result;
    }

    private normalizeSoaUploadRow(row: Record<string, unknown>): {
        neighborhood: string;
        block: string;
        lot: string;
        soa: string;
    } {
        const normalized: Record<string, unknown> = {};
        Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key
                .trim()
                .toLowerCase()
                .replace(/[\s_-]/g, '');
            normalized[normalizedKey] = value;
        });

        return {
            neighborhood: String(normalized.neighborhood || normalized.neighbor || '').trim(),
            block: String(normalized.block || '').trim(),
            lot: String(normalized.lot || '').trim(),
            soa: String(normalized.soa || '').replace(/[^0-9.-]/g, '').trim(),
        };
    }

    private buildSoaAccountId(neighborhood: string, block: string, lot: string): string {
        if (!neighborhood || !/^\d+$/.test(block) || !/^\d+$/.test(lot)) {
            return '';
        }

        return `${neighborhood}${block.padStart(3, '0')}${lot.padStart(3, '0')}`;
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

    async acceptMemberAgreement(accountId: number, version: string): Promise<void> {
        if (version !== MEMBER_AGREEMENT_VERSION) {
            throw new BadRequestException('This member agreement version is no longer current. Please reload and try again.');
        }

        const account = await this.propertyRepo.findOne({ where: { id: accountId } });
        if (!account) {
            throw new BadRequestException('Account not found');
        }

        if (!account.passwordChanged) {
            throw new BadRequestException('Please change your temporary password before accepting the member agreement.');
        }

        account.memberAgreementVersion = MEMBER_AGREEMENT_VERSION;
        account.memberAgreementAcceptedAt = new Date();
        await this.propertyRepo.save(account);
    }

}
