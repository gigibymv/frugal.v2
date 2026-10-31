import { z } from 'zod';
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, mkdtemp, lstat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// A pinned source, not a credential. The converter never contacts Supabase.
export const SOURCE_PROJECT_REF = 'zoeirjelygmmastmgfui';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_INPUT_BYTES = 100_000_000;
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).transform(value => value.toLowerCase());
const nullableText = z.string().max(2_000).nullable();
// PostgreSQL timestamptz carries up to six fractional digits. Preserve all six
// while normalizing offsets; Date.toISOString alone would discard microseconds.
const isoTimestamp = z.iso.datetime({ offset: true }).max(64)
  .refine(value => Number.isFinite(Date.parse(value)) && !/\.\d{7}/.test(value))
  .transform(value => {
    const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1] || '';
    return `${new Date(value).toISOString().slice(0, 19)}.${fraction.padEnd(6, '0')}Z`;
  });
const sourceMoney = z.union([z.number(), z.string().min(1).max(80)]);
const rowBase = { id: uuid, user_id: uuid, amount: sourceMoney };
const datedExpense = z.object({ ...rowBase, category: z.string(), description: nullableText,
  date: z.string(), created_at: isoTimestamp }).strict();
const sourceSchema = z.object({
  projectRef: z.literal(SOURCE_PROJECT_REF),
  exportedAt: isoTimestamp,
  // Deliberately excludes authentication hashes, tokens and provider metadata.
  users: z.array(z.object({ id: uuid, email: z.email().max(254).nullable().optional() }).strict()).max(50_000),
  budgets: z.array(z.object({ ...rowBase, effective_from: z.string(), updated_at: isoTimestamp,
    created_at: isoTimestamp.nullable().optional() }).strict()).max(250_000),
  expenses: z.array(datedExpense).max(1_000_000),
  recurring_expenses: z.array(z.object({ ...rowBase, category: z.string(), description: nullableText,
    frequency: z.string(), start_date: z.string(), last_generated: z.string().nullable(),
    active: z.boolean(), created_at: isoTimestamp }).strict()).max(50_000),
  oneoff_expenses: z.array(datedExpense).max(500_000),
}).strict();

export class ExportConversionError extends Error {
  constructor(code, message) { super(message); this.name = 'ExportConversionError'; this.code = code; }
}

// Compare decimal representations without rounding financial string values to fit
// JavaScript. Trailing zeroes and exponential notation can represent the same value.
function canonicalDecimal(value) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d{1,3}))?$/.exec(value);
  if (!match) throw new ExportConversionError('INVALID_AMOUNT', 'Invalid financial amount representation.');
  let digits = (match[2] + (match[3] || '')).replace(/^0+/, '');
  if (!digits) return '0';
  let scale = (match[3]?.length || 0) - Number(match[4] || 0);
  while (digits.endsWith('0')) { digits = digits.slice(0, -1); scale--; }
  return `${match[1] === '-' ? '-' : ''}${digits}:${scale}`;
}
function amount(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ExportConversionError('INVALID_AMOUNT', 'Invalid financial amount.');
    return value;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || canonicalDecimal(value) !== canonicalDecimal(String(number))) {
    throw new ExportConversionError('AMOUNT_PRECISION', 'A financial string cannot be represented faithfully; source remains unchanged.');
  }
  return number;
}

export async function loadSnapshotSchema() {
  const directory = await mkdtemp(join(tmpdir(), 'frugal-converter-schema-'));
  const output = join(directory, 'snapshot.mjs');
  try {
    await build({ entryPoints: [join(ROOT, 'shared/snapshot.ts')], outfile: output,
      bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
    return (await import(pathToFileURL(output).href)).snapshotSchema;
  } finally { await rm(directory, { recursive: true, force: true }); }
}

export function convertExport(input, snapshotSchema, expectedProjectRef) {
  if (expectedProjectRef !== SOURCE_PROJECT_REF) {
    throw new ExportConversionError('WRONG_EXPECTED_SOURCE', 'Expected project reference must match the pinned Frugal source.');
  }
  const parsed = sourceSchema.safeParse(input);
  if (!parsed.success) throw new ExportConversionError('INVALID_SOURCE', 'Source export schema validation failed. No conversion was written.');
  const source = parsed.data;
  const users = new Map();
  for (const user of source.users) {
    if (users.has(user.id)) throw new ExportConversionError('DUPLICATE_USER', 'Duplicate source user UUID.');
    users.set(user.id, {
      data: { budgetHistory: [], expenses: [], recurringExpenses: [], oneOffExpenses: [], settings: { displayName: '', weekStartDay: 1 } },
      counts: { budgets: 0, expenses: 0, recurring_expenses: 0, oneoff_expenses: 0 },
      budgetFingerprints: new Map(),
    });
  }
  const totals = { budgets: 0, expenses: 0, recurring_expenses: 0, oneoff_expenses: 0 };
  for (const table of Object.keys(totals)) {
    const ids = new Set();
    for (const [index, row] of source[table].entries()) {
      if (ids.has(row.id)) throw new ExportConversionError('DUPLICATE_ROW_ID', `Duplicate source row UUID in ${table}, row ${index}.`);
      ids.add(row.id);
      const user = users.get(row.user_id);
      if (!user) throw new ExportConversionError('ORPHAN_ROW', `Orphan source row in ${table}, row ${index}.`);
      const mappedAmount = amount(row.amount);
      if (table === 'budgets') {
        const budget = { amount: mappedAmount, effectiveFrom: row.effective_from, updatedAt: row.updated_at };
        // The old sync regenerated budget UUIDs. Keep every history entry, and
        // count equal canonical content explicitly instead of deduplicating it.
        user.data.budgetHistory.push(budget);
        const key = JSON.stringify(budget);
        user.budgetFingerprints.set(key, (user.budgetFingerprints.get(key) || 0) + 1);
      } else if (table === 'recurring_expenses') {
        user.data.recurringExpenses.push({ id: row.id, amount: mappedAmount, category: row.category,
          description: row.description ?? '', frequency: row.frequency, startDate: row.start_date,
          lastGenerated: row.last_generated, active: row.active, createdAt: row.created_at });
      } else {
        user.data[table === 'expenses' ? 'expenses' : 'oneOffExpenses'].push({ id: row.id,
          amount: mappedAmount, category: row.category, description: row.description ?? '',
          date: row.date, createdAt: row.created_at });
      }
      user.counts[table]++;
      totals[table]++;
    }
  }
  const backups = new Map();
  const entries = [];
  for (const [oldUserId, user] of [...users].sort(([a], [b]) => a.localeCompare(b))) {
    user.data.budgetHistory.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    for (const key of ['expenses', 'recurringExpenses', 'oneOffExpenses']) {
      user.data[key].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const valid = snapshotSchema.safeParse(user.data);
    if (!valid.success) throw new ExportConversionError('INVALID_SNAPSHOT', 'A converted snapshot fails the current Frugal schema. No conversion was written.');
    const backup = {
      format: 'frugal-backup', version: 1, exportedAt: source.exportedAt,
      source: { system: 'supabase', projectRef: SOURCE_PROJECT_REF, userId: oldUserId },
      ...valid.data,
    };
    const duplicates = [...user.budgetFingerprints.values()].filter(count => count > 1);
    backups.set(oldUserId, backup);
    entries.push({ sourceUserId: oldUserId, filename: `${oldUserId}.json`, rows: user.counts,
      canonicalBudgetDuplicates: { groups: duplicates.length, extraRowsPreserved: duplicates.reduce((sum, count) => sum + count - 1, 0) } });
  }
  return { backups, manifest: {
    format: 'frugal-supabase-conversion-manifest', version: 1,
    projectRef: SOURCE_PROJECT_REF, sourceExportedAt: source.exportedAt,
    users: users.size, usersWithRows: entries.filter(entry => Object.values(entry.rows).some(count => count > 0)).length,
    rows: totals, budgetDuplicatePolicy: 'preserve-all-source-history-entries',
    identityPolicy: 'source-uuid-only-no-new-account-assignment',
    settingsPolicy: 'source-has-no-settings-table-default-empty-name-and-monday',
    entries,
  } };
}

export async function convertFile({ inputPath, outputDirectory, expectedProjectRef, snapshotSchema }) {
  let metadata;
  try { metadata = await lstat(inputPath); }
  catch { throw new ExportConversionError('INPUT_UNAVAILABLE', 'Input export could not be read.'); }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_INPUT_BYTES) {
    throw new ExportConversionError('INVALID_INPUT_FILE', 'Input must be a regular export file of at most 100 MB.');
  }
  let input;
  try { input = JSON.parse(await readFile(inputPath, 'utf8')); }
  catch { throw new ExportConversionError('INVALID_JSON', 'Input is not readable JSON.'); }
  const result = convertExport(input, snapshotSchema || await loadSnapshotSchema(), expectedProjectRef);
  // mkdir without recursive refuses an existing directory, file or symlink.
  try { await mkdir(outputDirectory, { mode: 0o700 }); }
  catch { throw new ExportConversionError('OUTPUT_EXISTS_OR_UNAVAILABLE', 'Output must be a new private directory. Existing outputs are never overwritten.'); }
  try {
    const outputMetadata = await lstat(outputDirectory);
    if (!outputMetadata.isDirectory() || (outputMetadata.mode & 0o077) !== 0) {
      throw new Error('Output permissions are not private');
    }
    for (const [userId, backup] of result.backups) {
      await writeFile(join(outputDirectory, `${userId}.json`), JSON.stringify(backup, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    }
    // A manifest is written last; absent manifest means incomplete output.
    await writeFile(join(outputDirectory, 'manifest.json'), JSON.stringify(result.manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  } catch {
    throw new ExportConversionError('OUTPUT_WRITE_FAILED', 'Private output write failed. Partial outputs may exist; choose a new output directory.');
  }
  return result.manifest;
}

function argumentsForCli(args) {
  if (args.length !== 6) throw new ExportConversionError('USAGE', 'Usage: node scripts/convert-supabase-export.mjs --input FILE --output-dir NEW_DIRECTORY --expected-project-ref FRUGAL_SOURCE_REF');
  const values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--output-dir', '--expected-project-ref'].includes(args[i]) || !args[i + 1] || values.has(args[i])) {
      throw new ExportConversionError('USAGE', 'Provide each required named argument exactly once.');
    }
    values.set(args[i], args[i + 1]);
  }
  return { inputPath: resolve(values.get('--input')), outputDirectory: resolve(values.get('--output-dir')), expectedProjectRef: values.get('--expected-project-ref') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const manifest = await convertFile(argumentsForCli(process.argv.slice(2)));
    const rowCount = Object.values(manifest.rows).reduce((sum, count) => sum + count, 0);
    console.log(`Converted ${manifest.users} source users and ${rowCount} rows into private backups. No accounts were assigned or data uploaded.`);
  } catch (error) {
    const safeError = error instanceof ExportConversionError ? `${error.code}: ${error.message}` : 'CONVERSION_FAILED: Offline conversion failed.';
    console.error(safeError);
    process.exitCode = 1;
  }
}
