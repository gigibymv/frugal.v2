import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, lstat, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SOURCE_PROJECT_REF, ExportConversionError, convertExport, convertFile, loadSnapshotSchema } from './convert-supabase-export.mjs';

const schema = await loadSnapshotSchema();
const USER = '10000000-0000-4000-8000-000000000001';
const OTHER = '10000000-0000-4000-8000-000000000002';
const THIRD = '10000000-0000-4000-8000-000000000003';
const rowId = n => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const time = '2026-10-30T12:00:00+00:00';
const fixture = () => ({
  projectRef: SOURCE_PROJECT_REF, exportedAt: time,
  users: [{ id: USER, email: 'synthetic-sensitive-identity@example.test' }, { id: OTHER }, { id: THIRD, email: null }],
  budgets: [
    { id: rowId(1), user_id: USER, amount: '500.00', effective_from: '2026-10-26', updated_at: time, created_at: null },
    { id: rowId(2), user_id: USER, amount: 500, effective_from: '2026-10-26', updated_at: '2026-10-30T08:00:00-04:00' },
    { id: rowId(3), user_id: USER, amount: '400', effective_from: '2026-01-01', updated_at: '2026-01-01T12:00:00Z' },
  ],
  expenses: [{ id: rowId(10), user_id: USER, amount: '12.50', category: 'dining', description: null, date: '2024-02-29', created_at: time }],
  recurring_expenses: [{ id: rowId(20), user_id: USER, amount: '0.0000001', category: 'bills', description: 'synthetic-financial-content', frequency: 'monthly', start_date: '2026-01-31', last_generated: null, active: false, created_at: time }],
  oneoff_expenses: [{ id: rowId(30), user_id: OTHER, amount: 75, category: 'gifts', description: '', date: '2026-10-30', created_at: time }],
});
const convert = value => convertExport(value, schema, SOURCE_PROJECT_REF);
const rejects = (value, code) => assert.throws(() => convert(value), error => error instanceof ExportConversionError && error.code === code);
const clone = value => structuredClone(value);
const converted = convert(fixture());
assert.equal(converted.backups.size, 3);
assert.equal(converted.manifest.usersWithRows, 2);
assert.deepEqual(converted.manifest.rows, { budgets: 3, expenses: 1, recurring_expenses: 1, oneoff_expenses: 1 });
const backup = converted.backups.get(USER);
assert.equal(backup.format, 'frugal-backup');
assert.equal(backup.version, 1);
assert.equal(backup.source.userId, USER);
assert(!('sourceAccountId' in backup) && !('ownerId' in backup), 'No new account owner is assigned');
assert.equal(backup.budgetHistory.length, 3, 'Canonical budget duplicates are preserved, not silently collapsed');
assert.equal(backup.budgetHistory[0].amount, 400, 'Budget history retains old chronological ordering');
assert.deepEqual(converted.manifest.entries.find(entry => entry.sourceUserId === USER).canonicalBudgetDuplicates, { groups: 1, extraRowsPreserved: 1 });
assert.equal(backup.expenses[0].description, '');
assert.equal(backup.expenses[0].amount, 12.5);
assert.equal(backup.recurringExpenses[0].lastGenerated, null);
assert.equal(backup.recurringExpenses[0].active, false);
assert.equal(backup.recurringExpenses[0].amount, 0.0000001);
assert.equal(backup.expenses[0].createdAt, '2026-10-30T12:00:00.000000Z');
assert.equal(converted.backups.get(OTHER).oneOffExpenses[0].category, 'gifts');
assert.equal(converted.backups.get(THIRD).budgetHistory.length, 0, 'No fake budget entry is invented');
for (const entry of converted.backups.values()) {
  const { budgetHistory, expenses, recurringExpenses, oneOffExpenses, settings } = entry;
  assert(schema.safeParse({ budgetHistory, expenses, recurringExpenses, oneOffExpenses, settings }).success);
}
const serialized = JSON.stringify({ backups: [...converted.backups], manifest: converted.manifest });
assert(!serialized.includes('synthetic-sensitive-identity'), 'Emails are excluded from all artifacts');

let bad = fixture(); bad.projectRef = 'different-project'; rejects(bad, 'INVALID_SOURCE');
assert.throws(() => convertExport(fixture(), schema, 'different-project'), error => error.code === 'WRONG_EXPECTED_SOURCE');
bad = fixture(); bad.expenses[0].user_id = '99999999-9999-4999-8999-999999999999'; rejects(bad, 'ORPHAN_ROW');
bad = fixture(); bad.users.push({ id: USER.toUpperCase() }); rejects(bad, 'DUPLICATE_USER');
bad = fixture(); bad.expenses.push({ ...bad.expenses[0], user_id: OTHER }); rejects(bad, 'DUPLICATE_ROW_ID');
bad = fixture(); bad.budgets.push({ ...bad.budgets[0] }); rejects(bad, 'DUPLICATE_ROW_ID');
bad = fixture(); bad.expenses[0].category = 'gifts'; rejects(bad, 'INVALID_SNAPSHOT');
bad = fixture(); bad.oneoff_expenses[0].category = 'bills'; rejects(bad, 'INVALID_SNAPSHOT');
bad = fixture(); bad.expenses[0].date = '2026-02-29'; rejects(bad, 'INVALID_SNAPSHOT');
bad = fixture(); bad.expenses[0].created_at = null; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.budgets[0].updated_at = null; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.recurring_expenses[0].active = null; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.recurring_expenses[0].last_generated = '2026-04-31'; rejects(bad, 'INVALID_SNAPSHOT');
bad = fixture(); bad.expenses[0].amount = '0.10000000000000001'; rejects(bad, 'AMOUNT_PRECISION');
bad = fixture(); bad.expenses[0].amount = 'not-a-number'; rejects(bad, 'AMOUNT_PRECISION');
bad = fixture(); bad.expenses[0].amount = -5; rejects(bad, 'INVALID_SNAPSHOT');
bad = fixture(); bad.expenses[0].amount = Infinity; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.users[0].encrypted_password = 'must-never-be-copied'; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.auth = { token: 'must-never-be-copied' }; rejects(bad, 'INVALID_SOURCE');
bad = fixture(); bad.users[0].id = '../../escape'; rejects(bad, 'INVALID_SOURCE');
const micros = fixture();
micros.expenses[0].created_at = '2026-10-30T08:00:00.123456-04:00';
micros.expenses.push({ ...micros.expenses[0], id: rowId(11), created_at: '2026-10-30T12:00:00.123457Z' });
const microBackup = convert(micros).backups.get(USER);
assert.equal(microBackup.expenses[0].createdAt, '2026-10-30T12:00:00.123457Z');
assert.equal(microBackup.expenses[1].createdAt, '2026-10-30T12:00:00.123456Z', 'Microsecond timestamp precision is preserved');
// Table namespaces are independent in the original SQL, so cross-table IDs can coincide.
const independentTables = fixture(); independentTables.oneoff_expenses[0].id = independentTables.expenses[0].id;
assert.equal(convert(independentTables).backups.get(OTHER).oneOffExpenses.length, 1);
// Canonical UUID casing resolves references and catches case-collisions.
const casing = fixture(); casing.users[0].id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
for (const table of ['budgets', 'expenses', 'recurring_expenses']) for (const row of casing[table]) row.user_id = casing.users[0].id.toUpperCase();
assert(convert(casing).backups.has(casing.users[0].id));
casing.users.push({ id: casing.users[0].id.toUpperCase() }); rejects(casing, 'DUPLICATE_USER');

const directory = await mkdtemp(join(tmpdir(), 'frugal-export-fixtures-'));
try {
  const inputPath = join(directory, 'sanitized-export.json');
  const outputDirectory = join(directory, 'converted');
  await writeFile(inputPath, JSON.stringify(fixture()), { mode: 0o600 });
  const manifest = await convertFile({ inputPath, outputDirectory, expectedProjectRef: SOURCE_PROJECT_REF, snapshotSchema: schema });
  assert.equal(manifest.users, 3);
  assert.equal((await lstat(outputDirectory)).mode & 0o777, 0o700);
  for (const name of ['manifest.json', `${USER}.json`, `${OTHER}.json`, `${THIRD}.json`]) {
    assert.equal((await lstat(join(outputDirectory, name))).mode & 0o777, 0o600);
  }
  assert.deepEqual(JSON.parse(await readFile(join(outputDirectory, 'manifest.json'), 'utf8')), manifest);
  const before = await readFile(join(outputDirectory, `${USER}.json`), 'utf8');
  await assert.rejects(convertFile({ inputPath, outputDirectory, expectedProjectRef: SOURCE_PROJECT_REF, snapshotSchema: schema }), error => error.code === 'OUTPUT_EXISTS_OR_UNAVAILABLE');
  assert.equal(await readFile(join(outputDirectory, `${USER}.json`), 'utf8'), before, 'Reruns never overwrite an output');
  await mkdir(join(directory, 'symlink-target'));
  await symlink(join(directory, 'symlink-target'), join(directory, 'output-link'));
  await assert.rejects(convertFile({ inputPath, outputDirectory: join(directory, 'output-link'), expectedProjectRef: SOURCE_PROJECT_REF, snapshotSchema: schema }), error => error.code === 'OUTPUT_EXISTS_OR_UNAVAILABLE');
  await symlink(inputPath, join(directory, 'input-link'));
  await assert.rejects(convertFile({ inputPath: join(directory, 'input-link'), outputDirectory: join(directory, 'input-link-output'), expectedProjectRef: SOURCE_PROJECT_REF, snapshotSchema: schema }), error => error.code === 'INVALID_INPUT_FILE');
  await writeFile(inputPath, '{broken JSON', { mode: 0o600 });
  await assert.rejects(convertFile({ inputPath, outputDirectory: join(directory, 'broken'), expectedProjectRef: SOURCE_PROJECT_REF, snapshotSchema: schema }), error => error.code === 'INVALID_JSON');
  const cli = join(dirname(fileURLToPath(import.meta.url)), 'convert-supabase-export.mjs');
  await writeFile(inputPath, JSON.stringify(fixture()), { mode: 0o600 });
  const result = spawnSync(process.execPath, [cli, '--input', inputPath, '--output-dir', join(directory, 'cli-output'), '--expected-project-ref', SOURCE_PROJECT_REF], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.includes('Converted 3 source users and 6 rows'));
  assert(!result.stdout.includes('synthetic-sensitive-identity') && !result.stderr.includes('synthetic-sensitive-identity'));
  assert(!result.stdout.includes('synthetic-financial-content') && !result.stderr.includes('synthetic-financial-content'));
  const invalid = fixture(); invalid.users[0].password = 'synthetic-never-log-this';
  await writeFile(inputPath, JSON.stringify(invalid), { mode: 0o600 });
  const failure = spawnSync(process.execPath, [cli, '--input', inputPath, '--output-dir', join(directory, 'invalid-cli-output'), '--expected-project-ref', SOURCE_PROJECT_REF], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(failure.status, 1);
  assert(failure.stderr.includes('INVALID_SOURCE'));
  assert(!failure.stderr.includes('synthetic-never-log-this'));
  await assert.rejects(lstat(join(directory, 'invalid-cli-output')), error => error.code === 'ENOENT');
} finally { await rm(directory, { recursive: true, force: true }); }
console.log('PASS: offline export mapping, canonical budget duplicates preserved, schema/source/orphan/collision/precision checks, private output modes, no overwrite/symlink escape, safe CLI logs');
