require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { DBFFile } = require('dbffile');

const TABLES = {
    members: {
        dbfPath: process.env.MEMBERS_DBF,
        receivePath: '/sync/members',
        normalize: normalizeMemberRecord,
    },
    payments: {
        dbfPath: process.env.PAYMENTS_DBF,
        receivePath: '/sync/payments',
        normalize: normalizePaymentRecord,
        filter: filterPaymentRecord,
    },
    billing: {
        dbfPath: process.env.BILLINGS_DBF,
        receivePath: '/sync/billings',
        normalize: normalizeBillingRecord,
        filter: filterBillingRecord,
    },
    adjustments: {
        dbfPath: process.env.ADJUSTMENTS_DBF,
        receivePath: '/sync/adjustments',
        normalize: normalizeAdjustmentRecord,
        filter: filterAdjustmentRecord,
    },
};

const config = {
    apiBaseUrl: trimTrailingSlash(requiredEnv('API_BASE_URL')),
    apiKey: requiredEnv('API_KEY'),
    intervalMs: Math.max(1, Number(process.env.SYNC_INTERVAL_SECONDS || 5)) * 1000,
    batchSize: Math.max(1, Number(process.env.SYNC_BATCH_SIZE || 500)),
    retryAttempts: Math.max(1, Number(process.env.API_RETRY_ATTEMPTS || 3)),
    encoding: process.env.DBF_ENCODING || 'latin1',
    autoSyncEnabled: process.env.AUTO_SYNC_ENABLED !== 'false',
    autoSyncTables: parseAutoSyncTables(
        process.env.AUTO_SYNC_TABLES || 'members,payments,billing,adjustments',
    ),
    autoSyncOnStart: process.env.AUTO_SYNC_ON_START === 'true',
    stateFile: path.resolve(process.env.STATE_FILE || 'state.json'),
};

let isRunning = false;
let state = loadState();

main().catch((error) => {
    logError('Fatal startup error', error);
    process.exit(1);
});

async function main() {
    validateConfig();
    log('Server PC sync service started.');
    log(`Portal API: ${config.apiBaseUrl}`);

    const autoSyncLabel = config.autoSyncEnabled
        ? `on (${config.autoSyncTables.join(', ')})`
        : 'off';

    log(
        `Polling every ${config.intervalMs / 1000}s. `
        + `Batch size: ${config.batchSize}. Auto sync: ${autoSyncLabel}.`,
    );

    await tick();

    setInterval(() => {
        tick().catch((error) => logError('Sync tick failed', error));
    }, config.intervalMs);
}

async function tick() {
    if (isRunning) {
        log('Previous sync pass is still running; skipping this tick.');
        return;
    }

    isRunning = true;

    try {
        await processPendingRequests();

        if (config.autoSyncEnabled) {
            await processChangedFiles();
        }
    } finally {
        isRunning = false;
    }
}

async function processPendingRequests() {
    const pending = await apiRequest('GET', '/sync/requests/pending');

    if (!Array.isArray(pending) || pending.length === 0) {
        return;
    }

    for (const request of pending) {
        const type = normalizeRequestType(request.type);

        if (!type || !TABLES[type]) {
            await failRequest(request.id, `Unsupported sync type: ${request.type || ''}`);
            continue;
        }

        await processManualRequest(request.id, type);
    }
}

async function processManualRequest(requestId, type) {
    try {
        await apiRequest('POST', `/sync/requests/${requestId}/start`);

        const records = await readTable(type);
        const result = await pushRecords(type, records, requestId);
        const recordsUpdated = result.recordsUpdated !== undefined
            ? Number(result.recordsUpdated || 0)
            : Number(result.inserted || 0) + Number(result.updated || 0);

        await apiRequest('POST', `/sync/requests/${requestId}/complete`, {
            recordsProcessed: records.length,
            recordsUpdated,
        });

        log(`Manual ${type} sync completed. Records: ${records.length}.`);
    } catch (error) {
        logError(`Manual ${type} sync failed`, error);
        await failRequest(requestId, error.message || String(error));
    }
}

async function processChangedFiles() {
    for (const type of config.autoSyncTables) {
        const table = TABLES[type];

        if (!table) {
            continue;
        }

        const mtimeMs = await getMtimeMs(table.dbfPath);
        const previous = state.mtimes[type];

        if (!mtimeMs) {
            continue;
        }

        if (!previous) {
            state.mtimes[type] = mtimeMs;
            saveState();

            if (!config.autoSyncOnStart) {
                continue;
            }
        } else if (mtimeMs === previous) {
            continue;
        }

        try {
            const records = await readTable(type);
            await pushRecords(type, records);

            state.mtimes[type] = mtimeMs;
            saveState();

            log(`Auto ${type} sync completed. Records: ${records.length}.`);
        } catch (error) {
            logError(`Auto ${type} sync failed`, error);
        }
    }
}

async function readTable(type) {
    const table = TABLES[type];

    if (!table.dbfPath) {
        throw new Error(`${type} DBF path is not configured.`);
    }

    if (!fs.existsSync(table.dbfPath)) {
        throw new Error(`${type} DBF not found at ${table.dbfPath}`);
    }

    const dbf = await DBFFile.open(table.dbfPath, { encoding: config.encoding });
    const rows = [];
    let batch = await dbf.readRecords(500);

    while (batch.length > 0) {
        for (const raw of batch) {
            const record = table.normalize(raw);

            if (!table.filter || table.filter(record)) {
                rows.push(record);
            }
        }

        batch = await dbf.readRecords(500);
    }

    return rows;
}

async function pushRecords(type, records, requestId) {
    const table = TABLES[type];
    const totals = {
        inserted: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        recordsProcessed: 0,
        recordsUpdated: 0,
        errors: [],
    };

    for (let start = 0; start < records.length; start += config.batchSize) {
        const batch = records.slice(start, start + config.batchSize);
        const result = await apiRequest('POST', table.receivePath, {
            requestId,
            records: batch,
        });

        totals.inserted += Number(result?.inserted || 0);
        totals.updated += Number(result?.updated || 0);
        totals.skipped += Number(result?.skipped || 0);
        totals.recordsProcessed += Number(result?.recordsProcessed || batch.length);
        totals.recordsUpdated += result?.recordsUpdated !== undefined
            ? Number(result.recordsUpdated || 0)
            : Number(result?.inserted || 0) + Number(result?.updated || 0);

        if (Array.isArray(result?.errors)) {
            totals.errors.push(...result.errors);
        }

        log(
            `Pushed ${type} batch ${Math.floor(start / config.batchSize) + 1}/`
            + `${Math.ceil(records.length / config.batchSize)} (${batch.length} records).`,
        );
    }

    if (type === 'payments') {
        const referenceNumbers = Array.from(new Set(
            records
                .map((record) => record.referenceNumber)
                .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
                .map((value) => String(value).trim()),
        ));

        const reconcileResult = await apiRequest('POST', '/sync/payments/reconcile', {
            requestId,
            referenceNumbers,
        });

        const deleted = Number(reconcileResult?.deleted || 0);
        totals.deleted = deleted;
        totals.recordsUpdated += deleted;

        log(
            `Reconciled payments. Deleted from FoxPro: ${deleted}. `
            + `References checked: ${referenceNumbers.length}.`,
        );
    }

    if (type === 'adjustments') {
        const reconcileResult = await apiRequest(
            'POST',
            '/sync/adjustments/reconcile',
            {
                requestId,
                records,
            },
        );

        const deleted = Number(reconcileResult?.deleted || 0);
        totals.deleted = deleted;
        totals.recordsUpdated += deleted;

        log(`Reconciled adjustments. Deleted from VPS mirror: ${deleted}.`);
    }

    return totals;
}

async function failRequest(requestId, errorMessage) {
    try {
        await apiRequest('POST', `/sync/requests/${requestId}/fail`, {
            errorMessage,
            recordsProcessed: 0,
            recordsUpdated: 0,
        });
    } catch (error) {
        logError(`Failed to mark request ${requestId} as failed`, error);
    }
}

async function apiRequest(method, route, body) {
    let lastError;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
        try {
            const response = await fetch(`${config.apiBaseUrl}${route}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.apiKey}`,
                    'x-api-key': config.apiKey,
                },
                body: body === undefined ? undefined : JSON.stringify(body),
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : null;

            if (!response.ok) {
                throw new Error(data?.message || `API request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            lastError = error;

            if (attempt < config.retryAttempts) {
                await delay(1000 * attempt);
            }
        }
    }

    throw lastError;
}

function normalizeBillingRecord(raw) {
    const normalized = normalizeKeys(raw);

    return {
        accountId: cleanText(normalized.keysearch),
        billDate: toDateKey(normalized.billdate),
        dateFrom: toDateKey(normalized.datefrom),
        dateTo: toDateKey(normalized.dateto),
        dueDate: toDateKey(normalized.duedate),
        prinBal: toNumber(normalized.prinbal),
        intBal: toNumber(normalized.intbal),
        penBal: toNumber(normalized.penbal),
        prinCurr: toNumber(normalized.princurr),
        intCurr: toNumber(normalized.intcurr),
        penCurr: toNumber(normalized.pencurr),
        duesRate: toNumber(normalized.duesrate),
    };
}

function normalizePaymentRecord(raw) {
    const normalized = normalizeKeys(raw);
    const paycat = cleanText(normalized.paycat);
    const descriptionSource = paycat.toLowerCase() === 'membership dues'
        ? normalized.applicable
        : normalized.particula3;
    const accountId = cleanText(normalized.keysearch);
    const referenceNumber = cleanText(normalized.orno);

    return {
        accountId: accountId || null,
        paymentDate: toDateKey(normalized.paydate),
        amountPaid: toNumber(normalized.amtpaid),
        description: cleanText(descriptionSource),
        paycat: paycat || null,
        referenceNumber: referenceNumber || null,
    };
}

function normalizeAdjustmentRecord(raw) {
    const normalized = normalizeKeys(raw);

    return {
        transDate: toDateKey(normalized.transdate),
        principal: toNumber(normalized.principal),
        interest: toNumber(normalized.interest),
        accountId: cleanText(normalized.keysearch),
        memberName: cleanText(normalized.membername),
        penalty: toNumber(normalized.penalty),
    };
}

function normalizeMemberRecord(raw) {
    const normalized = normalizeKeys(raw);
    const neighborhood = cleanText(normalized.neighbor || normalized.neighborhood);
    const block = formatMemberSegment(normalized.block1 || normalized.block, 3);
    const lot = formatMemberSegment(normalized.lot || normalized.lotno, 3);
    const accountId = resolveMemberAccountId(normalized, neighborhood, block, lot);
    const fallbackSegments = parseMemberSegmentsFromAccountId(accountId);
    const classification = normalizeMemberClassification(
        normalized.holo || normalized.classification || '',
    );

    return {
        accountId,
        neighborhood: neighborhood || fallbackSegments.neighborhood,
        block: block || fallbackSegments.block,
        lot: lot || fallbackSegments.lot,
        memberName: buildMemberName(normalized),
        propertySizeSqm: toNumberOrNull(normalized.lotsize),
        classification,
        gmail: cleanText(
            normalized.gmail
            || normalized.email
            || normalized.emailadd
            || normalized.emailaddress
            || normalized.mail
            || normalized.mailadd
            || normalized.mailaddress,
        ) || null,
        telno: cleanText(normalized.telno) || null,
        celno: cleanText(normalized.celno) || null,
    };
}

function filterPaymentRecord(record) {
    const cutoff = parseDateOnly(process.env.PAYMENTS_CUTOFF_DATE);

    if (!cutoff || !record.paymentDate) {
        return true;
    }

    return record.paymentDate >= formatDate(cutoff);
}

function filterBillingRecord(record) {
    const start = parseDateOnly(process.env.BILLINGS_START_DATE);

    if (!start || !record.dateFrom) {
        return true;
    }

    return record.dateFrom >= formatDate(start);
}

function filterAdjustmentRecord(record) {
    const start = parseDateOnly(
        process.env.ADJUSTMENTS_START_DATE || '2026-07-01',
    );

    if (!record.transDate) {
        return false;
    }

    return !start || record.transDate >= formatDate(start);
}

async function getMtimeMs(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return 0;
    }

    const stat = await fs.promises.stat(filePath);
    return stat.mtimeMs;
}

function parseAutoSyncTables(value) {
    const allowed = new Set(Object.keys(TABLES));
    const selected = String(value || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => allowed.has(item));

    return selected.length ? Array.from(new Set(selected)) : Object.keys(TABLES);
}

function normalizeRequestType(type) {
    const normalized = cleanText(type).toLowerCase();

    if (normalized === 'billings') {
        return 'billing';
    }

    if (normalized === 'adjustment' || normalized === 'adjustments') {
        return 'adjustments';
    }

    if (normalized === 'members' || normalized === 'payments' || normalized === 'billing') {
        return normalized;
    }

    return '';
}

function normalizeKeys(raw) {
    const normalized = {};

    for (const [key, value] of Object.entries(raw || {})) {
        const normalizedKey = String(key)
            .trim()
            .split(',')[0]
            .trim()
            .toLowerCase()
            .replace(/[\s_-]/g, '');

        normalized[normalizedKey] = value;
    }

    return normalized;
}

function cleanText(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function toDateKey(value) {
    const parsed = parseFoxProDate(value);
    return parsed ? formatDate(parsed) : null;
}

function parseFoxProDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);

    if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const yearTwo = Number(slashMatch[3]);
        const year = yearTwo <= 79 ? 2000 + yearTwo : 1900 + yearTwo;
        return new Date(year, month - 1, day);
    }

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (isoMatch) {
        return new Date(
            Number(isoMatch[1]),
            Number(isoMatch[2]) - 1,
            Number(isoMatch[3]),
        );
    }

    const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);

    if (compactMatch) {
        return new Date(
            Number(compactMatch[1]),
            Number(compactMatch[2]) - 1,
            Number(compactMatch[3]),
        );
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateOnly(value) {
    if (!value) {
        return null;
    }

    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return null;
    }

    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
    );
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatMemberSegment(value, length) {
    const text = cleanText(value);

    if (!text) {
        return '';
    }

    return /^\d+$/.test(text) ? text.padStart(length, '0') : text;
}

function resolveMemberAccountId(normalized, neighborhood, block, lot) {
    const keysearch = cleanText(normalized.keysearch);

    if (keysearch) {
        return keysearch;
    }

    if (neighborhood && block && lot) {
        return `${neighborhood}${block}${lot}`;
    }

    return '';
}

function parseMemberSegmentsFromAccountId(accountId) {
    const match = cleanText(accountId).match(/^([A-Za-z]+)(\d{3})(\d{3})$/);

    if (!match) {
        return { neighborhood: '', block: '', lot: '' };
    }

    return {
        neighborhood: match[1],
        block: match[2],
        lot: match[3],
    };
}

function buildMemberName(normalized) {
    const lastName = cleanText(normalized.lastname || normalized.last || normalized.surname);
    const firstName = cleanText(normalized.firstname || normalized.first);
    const middleName = cleanText(normalized.midname || normalized.middle);
    const base = [lastName, firstName].filter(Boolean).join(', ');

    if (!base) {
        return cleanText(normalized.membername || normalized.name);
    }

    return middleName ? `${base} ${middleName}` : base;
}

function normalizeMemberClassification(value) {
    const normalized = cleanText(value).toLowerCase();

    if (normalized === 'ho' || normalized === 'homeowner' || normalized === 'home owner') {
        return 'HOMEOWNER';
    }

    if (normalized === 'lo' || normalized === 'lot owner' || normalized === 'lotowner') {
        return 'LOT OWNER';
    }

    return cleanText(value) || null;
}

function validateConfig() {
    if (typeof fetch !== 'function') {
        throw new Error(
            'Node.js 20 or newer is required because this service uses built-in fetch.',
        );
    }

    for (const [type, table] of Object.entries(TABLES)) {
        if (!table.dbfPath) {
            throw new Error(`${type.toUpperCase()} DBF path is missing in .env.`);
        }
    }
}

function requiredEnv(key) {
    const value = cleanText(process.env[key]);

    if (!value) {
        throw new Error(`${key} is required.`);
    }

    return value;
}

function trimTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}

function loadState() {
    try {
        const statePath = config?.stateFile || path.resolve(process.env.STATE_FILE || 'state.json');

        if (!fs.existsSync(statePath)) {
            return { mtimes: {} };
        }

        return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
        return { mtimes: {} };
    }
}

function saveState() {
    fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
    const detail = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[${new Date().toISOString()}] ${message}: ${detail}`);
}
