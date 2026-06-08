import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { PropertyAccount } from '../property/property.entity';
import { WaterBilling } from './water-billing.entity';

interface ExtractedWaterBill {
    accountIdCandidates: string[];
    sheetKey: string;
    sheetName: string;
    billingPeriod: string;
    dueDate: Date | null;
    currentReading: number;
    previousReading: number;
    consumption: number;
    currentCharges: number;
    previousBalance: number;
    totalDue: number;
}

type WaterBillField = Exclude<keyof ExtractedWaterBill, 'accountIdCandidates' | 'sheetKey' | 'sheetName'>;

interface BillAnchor {
    key: string;
    accountIdCandidates: string[];
    row: number;
    col: number;
}

type WaterBillDraft = Partial<Record<WaterBillField, string | number | Date | null>> & {
    accountIdCandidates: string[];
    anchor: BillAnchor;
    sheetKey: string;
    sheetName: string;
};

interface WaterBillFieldDefinition {
    field: WaterBillField;
    label: string;
    type: 'text' | 'date' | 'number';
    stopLabels?: string[];
}

export interface SheetExtractionSummary {
    sheetName: string;
    sheetKey: string;
    anchors: number;
    extracted: number;
    skippedIncomplete: number;
    incompleteAccountIds: string[];
    validationSkipped: number;
    validationSkippedAccountIds: string[];
}

export interface WaterBillExtractionResult {
    records: ExtractedWaterBill[];
    sheetSummaries: SheetExtractionSummary[];
}

@Injectable()
export class WaterBillsService {
    private readonly targetSheetKeys = new Set(['NA', 'NB', 'NC', 'ND1', 'ND2', 'ND3', 'NE']);
    private readonly valueStopLabels = [
        'Name',
        'Address',
        'Period',
        'Due Date',
        'Current Charges',
        'Outstanding Charges',
        'Current Reading',
        'Previous Reading',
        'Consumption',
        'Balance from Previous Bill',
        'Less Payment of Previous Bill',
        'Less Payment from Previous Bill',
        'Add Current Charges',
        'Total Current Charges',
        'Total Amount Due',
        'Total Amount Due for Payment',
        'cum',
        'rate/cum',
        'Important',
        'Please pay',
    ];
    private readonly fieldDefinitions: WaterBillFieldDefinition[] = [
        { field: 'billingPeriod', label: 'Period', type: 'text', stopLabels: ['Due Date'] },
        { field: 'dueDate', label: 'Due Date', type: 'date' },
        { field: 'currentReading', label: 'Current Reading', type: 'number' },
        { field: 'previousReading', label: 'Previous Reading', type: 'number' },
        { field: 'consumption', label: 'Consumption', type: 'number' },
        { field: 'currentCharges', label: 'Total Current Charges', type: 'number' },
        { field: 'previousBalance', label: 'Balance from Previous Bill', type: 'number' },
        { field: 'totalDue', label: 'Total Amount Due for Payment', type: 'number' },
        { field: 'totalDue', label: 'Total Amount Due', type: 'number' },
    ];

    constructor(
        @InjectRepository(WaterBilling)
        private waterBillingRepo: Repository<WaterBilling>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        private dataSource: DataSource,
    ) { }

    async uploadWaterBillings(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const fileName = file.originalname.toLowerCase();
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            throw new BadRequestException('Unsupported file type. Use XLS or XLSX.');
        }

        const extraction = this.extractWaterBillings(file.buffer);
        const records = extraction.records;
        const result = {
            inserted: 0,
            updated: 0,
            failed: 0,
            totalExtracted: records.length,
            skippedAccountIds: [] as string[],
            validationErrors: [] as string[],
            sheetSummaries: extraction.sheetSummaries,
        };
        const sheetSummaryByKey = new Map(result.sheetSummaries.map((summary) => [summary.sheetKey, summary]));

        await this.dataSource.transaction(async (manager) => {
            const waterBillingRepo = manager.getRepository(WaterBilling);
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;
                const account = await propertyRepo.findOne({
                    where: { accountId: In(record.accountIdCandidates) },
                });

                if (!account?.accountId) {
                    result.failed += 1;
                    const label = record.accountIdCandidates[0] || 'unknown';
                    result.skippedAccountIds.push(label);
                    result.validationErrors.push(`Record ${row}: accountId not found (${label})`);
                    const sheetSummary = sheetSummaryByKey.get(record.sheetKey);
                    if (sheetSummary) {
                        sheetSummary.validationSkipped += 1;
                        if (sheetSummary.validationSkippedAccountIds.length < 8) {
                            sheetSummary.validationSkippedAccountIds.push(label);
                        }
                    }
                    continue;
                }

                const payload = {
                    accountId: account.accountId,
                    account,
                    billingPeriod: record.billingPeriod,
                    dueDate: record.dueDate,
                    currentReading: record.currentReading,
                    previousReading: record.previousReading,
                    consumption: record.consumption,
                    currentCharges: record.currentCharges,
                    previousBalance: record.previousBalance,
                    totalDue: record.totalDue,
                };

                const existing = await waterBillingRepo.findOne({
                    where: [
                        {
                            accountId: account.accountId,
                            billingPeriod: record.billingPeriod,
                        },
                        ...(record.dueDate
                            ? [
                                {
                                    accountId: account.accountId,
                                    dueDate: record.dueDate,
                                },
                            ]
                            : []),
                    ],
                });

                if (existing?.id) {
                    await waterBillingRepo.update({ id: existing.id }, payload);
                    result.updated += 1;
                    continue;
                }

                await waterBillingRepo.save(waterBillingRepo.create(payload));
                result.inserted += 1;
            }
        });

        return result;
    }

    async getWaterBillingsByAccount(accountId: string) {
        return this.waterBillingRepo
            .createQueryBuilder('waterBilling')
            .leftJoinAndSelect('waterBilling.account', 'account')
            .where('waterBilling.accountId = :accountId', { accountId })
            .orderBy('waterBilling.dueDate', 'DESC')
            .addOrderBy('waterBilling.id', 'DESC')
            .getMany()
            .then((billings) =>
                billings.map((billing) => ({
                    id: billing.id,
                    accountId: billing.accountId,
                    memberName: billing.account?.memberName || '',
                    billingPeriod: billing.billingPeriod,
                    dueDate: billing.dueDate,
                    currentReading: billing.currentReading,
                    previousReading: billing.previousReading,
                    consumption: billing.consumption,
                    currentCharges: billing.currentCharges,
                    previousBalance: billing.previousBalance,
                    totalDue: billing.totalDue,
                })),
            );
    }

    private extractWaterBillings(buffer: Buffer): WaterBillExtractionResult {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const records: ExtractedWaterBill[] = [];
        const sheetSummaries: SheetExtractionSummary[] = [];

        workbook.SheetNames.forEach((sheetName) => {
            const sheetKey = this.normalizeSheetName(sheetName);
            if (!this.targetSheetKeys.has(sheetKey)) {
                return;
            }

            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
                header: 1,
                defval: '',
                raw: false,
            });
            const anchors = this.extractBillAnchors(rows, this.accountPrefixesForSheet(sheetKey));
            const drafts = new Map<string, WaterBillDraft>();

            anchors.forEach((anchor) => {
                drafts.set(anchor.key, {
                    accountIdCandidates: anchor.accountIdCandidates,
                    anchor,
                    sheetKey,
                    sheetName,
                });
            });

            this.extractLabeledValues(rows, anchors, drafts);

            let extracted = 0;
            let skippedIncomplete = 0;
            const incompleteAccountIds: string[] = [];

            drafts.forEach((draft) => {
                const record = this.toExtractedWaterBill(draft);
                if (record) {
                    records.push(record);
                    extracted += 1;
                    return;
                }

                skippedIncomplete += 1;
                const label = draft.accountIdCandidates[0] || draft.anchor.key;
                if (label && incompleteAccountIds.length < 8) {
                    incompleteAccountIds.push(label);
                }
            });

            sheetSummaries.push({
                sheetName,
                sheetKey,
                anchors: anchors.length,
                extracted,
                skippedIncomplete,
                incompleteAccountIds,
                validationSkipped: 0,
                validationSkippedAccountIds: [],
            });
        });

        return { records, sheetSummaries };
    }

    private extractBillAnchors(rows: unknown[][], allowedPrefixes: string[]): BillAnchor[] {
        const anchorMap = new Map<string, BillAnchor>();

        rows.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const candidates = this.accountIdCandidatesFromText(this.cleanText(cell), allowedPrefixes);
                const paddedAccountId = candidates.find((candidate) => /^[A-Z][A-Z0-9]*\d{6}$/.test(candidate));
                if (!paddedAccountId) {
                    return;
                }

                const existing = anchorMap.get(paddedAccountId);
                if (!existing) {
                    anchorMap.set(paddedAccountId, {
                        key: paddedAccountId,
                        accountIdCandidates: candidates,
                        row: rowIndex,
                        col: colIndex,
                    });
                    return;
                }

                candidates.forEach((candidate) => {
                    if (!existing.accountIdCandidates.includes(candidate)) {
                        existing.accountIdCandidates.push(candidate);
                    }
                });

                if (rowIndex < existing.row || (rowIndex === existing.row && colIndex > existing.col)) {
                    existing.row = rowIndex;
                    existing.col = colIndex;
                }
            });
        });

        return [...anchorMap.values()];
    }

    private extractLabeledValues(
        rows: unknown[][],
        anchors: BillAnchor[],
        drafts: Map<string, WaterBillDraft>,
    ): void {
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
                const definition = this.findFieldDefinition(row[colIndex]);
                if (!definition) {
                    continue;
                }

                const owner = this.findOwnerAnchor(anchors, rowIndex, colIndex);
                const draft = owner ? drafts.get(owner.key) : null;
                if (!draft) {
                    continue;
                }

                const extractedValue = this.extractFieldValueFromRow(row, colIndex, definition);
                if (draft[definition.field] === undefined && extractedValue !== null && extractedValue !== '') {
                    draft[definition.field] = extractedValue;
                }
            }
        }
    }

    private findFieldDefinition(value: unknown): WaterBillFieldDefinition | null {
        const cellKey = this.normalizeLabel(value);
        if (!cellKey) {
            return null;
        }

        return (
            this.fieldDefinitions.find((definition) => cellKey === this.normalizeLabel(definition.label)) ||
            this.fieldDefinitions.find((definition) => cellKey.includes(this.normalizeLabel(definition.label))) ||
            null
        );
    }

    private findOwnerAnchor(anchors: BillAnchor[], rowIndex: number, colIndex: number): BillAnchor | null {
        const candidatesToRight = anchors
            .filter((anchor) => anchor.row <= rowIndex && anchor.col > colIndex)
            .sort((left, right) => {
                const rowDistance = rowIndex - left.row - (rowIndex - right.row);
                if (rowDistance !== 0) {
                    return rowDistance;
                }

                return left.col - colIndex - (right.col - colIndex);
            });

        if (candidatesToRight.length) {
            return candidatesToRight[0];
        }

        return (
            anchors
                .filter((anchor) => anchor.row <= rowIndex)
                .sort((left, right) => {
                    const leftDistance = Math.abs(left.row - rowIndex) + Math.abs(left.col - colIndex);
                    const rightDistance = Math.abs(right.row - rowIndex) + Math.abs(right.col - colIndex);
                    return leftDistance - rightDistance;
                })[0] || null
        );
    }

    private extractFieldValueFromRow(
        row: unknown[] | undefined,
        labelCol: number,
        definition: WaterBillFieldDefinition,
    ): string | number | Date | null {
        if (definition.type === 'number') {
            return this.findFirstNumberToRight(row, labelCol, definition);
        }

        const stopKeys = (definition.stopLabels || this.valueStopLabels)
            .filter((label) => this.normalizeLabel(label) !== this.normalizeLabel(definition.label))
            .map((label) => this.normalizeLabel(label));
        const text = this.valuesToRight(row, labelCol, (row?.length || 1) - 1, stopKeys)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (definition.type === 'date') {
            return this.parseDate(text);
        }

        return text;
    }

    private findFirstNumberToRight(
        row: unknown[] | undefined,
        labelCol: number,
        definition: WaterBillFieldDefinition,
    ): number | null {
        const stopKeys = this.valueStopLabels
            .filter((label) => this.normalizeLabel(label) !== this.normalizeLabel(definition.label))
            .map((label) => this.normalizeLabel(label));
        const numbers = this.valuesToRight(row, labelCol, (row?.length || 1) - 1, stopKeys)
            .map((value) => this.toNumberOrNull(value))
            .filter((value): value is number => value !== null);
        return numbers.length ? numbers[0] : null;
    }

    private toExtractedWaterBill(draft: WaterBillDraft): ExtractedWaterBill | null {
        const billingPeriod = typeof draft.billingPeriod === 'string' ? draft.billingPeriod : '';
        const dueDate = draft.dueDate instanceof Date ? draft.dueDate : null;
        const previousBalance = typeof draft.previousBalance === 'number' ? draft.previousBalance : 0;
        const totalDue = typeof draft.totalDue === 'number'
            ? draft.totalDue
            : this.computeTotalDue(previousBalance, draft.currentCharges);

        if (
            draft.accountIdCandidates.length === 0 ||
            !billingPeriod ||
            !dueDate ||
            typeof draft.currentReading !== 'number' ||
            typeof draft.previousReading !== 'number' ||
            typeof draft.consumption !== 'number' ||
            typeof draft.currentCharges !== 'number' ||
            typeof totalDue !== 'number'
        ) {
            return null;
        }

        return {
            accountIdCandidates: draft.accountIdCandidates,
            sheetKey: draft.sheetKey,
            sheetName: draft.sheetName,
            billingPeriod,
            dueDate,
            currentReading: draft.currentReading,
            previousReading: draft.previousReading,
            consumption: draft.consumption,
            currentCharges: draft.currentCharges,
            previousBalance,
            totalDue,
        };
    }

    private computeTotalDue(previousBalance: unknown, currentCharges: unknown): number | null {
        if (typeof previousBalance !== 'number' || typeof currentCharges !== 'number') {
            return null;
        }

        return Number((previousBalance + currentCharges).toFixed(2));
    }

    private extractAccountIdCandidates(
        rows: unknown[][],
        rowStart: number,
        rowEnd: number,
        colStart: number,
        colEnd: number,
    ): string[] {
        const candidates: string[] = [];

        for (let rowIndex = rowStart; rowIndex <= Math.min(rowEnd, rowStart + 6); rowIndex += 1) {
            for (let colIndex = colStart; colIndex <= colEnd; colIndex += 1) {
                const text = this.cleanText(rows[rowIndex]?.[colIndex]);
                if (!text) {
                    continue;
                }

                this.accountIdCandidatesFromText(text).forEach((candidate) => {
                    if (!candidates.includes(candidate)) {
                        candidates.push(candidate);
                    }
                });
            }
        }

        const paddedCandidates = candidates.filter((value) => /^[A-Z][A-Z0-9]*\d{6}$/.test(value));
        return paddedCandidates.length ? [...paddedCandidates, ...candidates] : candidates;
    }

    private accountIdCandidatesFromText(value: string, allowedPrefixes: string[] = []): string[] {
        const text = value.toUpperCase().replace(/\s+/g, '');
        const prefixes = allowedPrefixes.map((prefix) => prefix.toUpperCase()).sort((left, right) => right.length - left.length);
        const dashed = text.match(/^([A-Z][A-Z0-9]*)-(\d{1,3})-(\d{1,3})$/);

        if (dashed) {
            if (!this.isAllowedAccountPrefix(dashed[1], prefixes)) {
                return [];
            }

            const padded = `${dashed[1]}${dashed[2].padStart(3, '0')}${dashed[3].padStart(3, '0')}`;
            return [padded, text, `${dashed[1]}${Number(dashed[2])}${Number(dashed[3])}`];
        }

        const matchingPrefix = prefixes.find((prefix) => text.startsWith(prefix)) || '';
        const prefix = matchingPrefix || (text.match(/^([A-Z][A-Z0-9]*?)(\d+)$/)?.[1] ?? '');
        const digits = prefix ? text.slice(prefix.length) : '';

        if (prefix && this.isAllowedAccountPrefix(prefix, prefixes) && /^\d{6}$/.test(digits)) {
            return [text];
        }

        if (prefix && this.isAllowedAccountPrefix(prefix, prefixes) && /^\d{2,4}$/.test(digits)) {
            const block = digits.slice(0, 1);
            const lot = digits.slice(1);
            if (Number(block) <= 0 || Number(lot) <= 0) {
                return [];
            }

            const candidates: string[] = [];
            candidates.push(text);
            candidates.push(`${prefix}${block.padStart(3, '0')}${lot.padStart(3, '0')}`);
            return candidates;
        }

        return [];
    }

    private accountPrefixesForSheet(sheetKey: string): string[] {
        const section = sheetKey.replace(/^N/, '');
        if (section.startsWith('D')) {
            return ['D'];
        }

        return section ? [section] : [];
    }

    private isAllowedAccountPrefix(prefix: string, allowedPrefixes: string[]): boolean {
        return allowedPrefixes.length === 0 || allowedPrefixes.includes(prefix);
    }

    private valuesToRight(
        row: unknown[] | undefined,
        colIndex: number,
        colEnd: number,
        stopKeys: string[] = [],
    ): string[] {
        if (!row) {
            return [];
        }

        const values: string[] = [];
        for (let index = colIndex + 1; index <= colEnd; index += 1) {
            const text = this.cleanText(row[index]);
            if (stopKeys.some((stopKey) => this.normalizeLabel(text).includes(stopKey))) {
                break;
            }

            if (text) {
                values.push(text);
            }
        }
        return values;
    }

    private maxColumnCount(rows: unknown[][]): number {
        return rows.reduce((max, row) => Math.max(max, row.length), 0);
    }

    private normalizeSheetName(value: string): string {
        return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    private normalizeLabel(value: unknown): string {
        return this.cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    private cleanText(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value).trim();
    }

    private toNumberOrNull(value: unknown): number | null {
        const normalized = this.cleanText(value).replace(/,/g, '');
        if (!normalized || normalized === '-') {
            return null;
        }

        const number = Number(normalized);
        return Number.isNaN(number) ? null : number;
    }

    private parseDate(value: string): Date | null {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
}
