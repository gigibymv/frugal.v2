import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';

const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), get length() { return values.size; }, key: index => [...values.keys()][index] ?? null };
const sessionValues = new Map();
globalThis.sessionStorage = { getItem: key => sessionValues.get(key) ?? null, setItem: (key,value) => sessionValues.set(key,value), removeItem: key => sessionValues.delete(key) };
globalThis.window = { localStorage };
const legacyValue = JSON.stringify({ state: { expenses: [{ id: 'legacy-private', amount: 9 }] }, version: 0 });
localStorage.setItem('weekly-budget-expenses', legacyValue);
const output = new URL('./.account-check.mjs', import.meta.url);
await build({ stdin: { contents: [
  "export * from './src/lib/account-sync.ts';",
  "export { useAuthStore } from './src/store/authStore.ts';",
  "export * from './src/lib/budget-data.ts';",
  "export { createLocalBackup, parseBackup } from './src/lib/backup.ts';",
  "export { useExpenseStore } from './src/store/expenseStore.ts';",
  "export { useBudgetStore } from './src/store/budgetStore.ts';",
  "export { useRecurringExpenseStore } from './src/store/recurringExpenseStore.ts';",
].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', tsconfig: 'tsconfig.app.json', outfile: output.pathname });
let api;
try {
  api = await import(output.href);
  const { useExpenseStore: expenses, useBudgetStore: budget, useRecurringExpenseStore: recurring, useSyncStore: sync, startBudgetSync: start, stopBudgetSync: stop, saveBudgetData: save, emptyBudgetData: empty } = api;
  const dataA = empty(), dataB = empty();
  dataA.settings.displayName = 'Account A'; dataB.settings.displayName = 'Account B';
  const database = new Map([['A', { revision: 1, data: dataA }], ['B', { revision: 1, data: dataB }]]);
  let activeUser = 'A', holdGet = null, holdPut = null, loseNextResponse = false, failNextGet = false, rejectNextPut = false;
  let commits = 0, lastKeepalive = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  globalThis.fetch = async (url, options = {}) => {
    const user = new URL(url, 'http://localhost').searchParams.get('ownerId');
    if (user !== activeUser) return Response.json({}, { status: 403 });
    if (options.method !== 'PUT') {
      if (failNextGet) { failNextGet = false; throw new Error('offline startup'); }
      const result = clone(database.get(user) ?? { revision: 0, data: null });
      if (holdGet) { const wait = holdGet; holdGet = null; await wait; }
      return Response.json(result);
    }
    lastKeepalive = options.keepalive;
    const input = JSON.parse(options.body);
    if (rejectNextPut) { rejectNextPut = false; return Response.json({}, { status: 400 }); }
    if (holdPut) { const wait = holdPut; holdPut = null; await wait; }
    const existing = database.get(user);
    if (existing?.mutationId === input.mutationId && existing.revision === input.revision + 1 && JSON.stringify(existing.data) === JSON.stringify(input.data)) return Response.json({ revision: existing.revision });
    if ((existing?.revision ?? 0) !== input.revision) return Response.json({}, { status: 409 });
    database.set(user, { revision: input.revision + 1, data: clone(input.data), mutationId: input.mutationId }); commits++;
    if (loseNextResponse) { loseNextResponse = false; throw new Error('lost response'); }
    return Response.json({ revision: input.revision + 1 });
  };
  assert.equal(expenses.getState().expenses.length, 0, 'Legacy records must not hydrate into an unowned account');
  await start('A');
  assert.equal(api.readBudgetData().settings.displayName, 'Account A');
  assert.equal(sync.getState().status, 'ready', 'Nothing due must not schedule a cloud write');
  const expense = { amount: 12.5, category: 'groceries', description: 'First', date: '2026-10-30' };
  expenses.getState().addExpense(expense);
  assert.equal(sync.getState().status, 'pending');
  await save(true);
  assert.equal(lastKeepalive, true, 'Small page-exit saves use keepalive immediately');
  assert.equal(database.get('A').data.expenses.length, 1);
  assert.equal(database.get('B').data.expenses.length, 0);
  const firstId = expenses.getState().expenses[0].id;
  expenses.getState().editExpense(firstId, { ...expense, amount: 2_000_000_000 });
  await save(); assert.equal(sync.getState().status, 'invalid');
  expenses.getState().editExpense(firstId, expense); await save();
  assert.equal(sync.getState().status, 'ready', 'Correcting invalid data must unstick the save queue');
  rejectNextPut = true;
  expenses.getState().editExpense(firstId, { ...expense, description: 'Rejected once' });
  await save(); assert.equal(sync.getState().status, 'invalid');
  expenses.getState().editExpense(firstId, expense); await save();
  assert.equal(sync.getState().status, 'ready', '400 must clear the rejected pending payload');
  // Unknown outcome retries the same mutation, never commits twice.
  loseNextResponse = true;
  expenses.getState().addExpense({ ...expense, description: 'Lost response' });
  await save();
  assert.equal(sync.getState().status, 'offline');
  const beforeRetry = commits;
  await save();
  assert.equal(commits, beforeRetry);
  assert.equal(sync.getState().status, 'ready');
  // A newer edit while an older save is running remains dirty and is saved next.
  let releasePut; holdPut = new Promise(resolve => { releasePut = resolve; });
  expenses.getState().addExpense({ ...expense, description: 'In-flight' });
  const inFlight = save();
  expenses.getState().addExpense({ ...expense, description: 'While saving' });
  releasePut(); await inFlight; await save();
  assert.equal(database.get('A').data.expenses.length, 4);
  // An A response that arrives after switching to B cannot change B's stores.
  let releaseGet; holdGet = new Promise(resolve => { releaseGet = resolve; });
  const loadingA = start('A');
  activeUser = 'B'; await start('B'); releaseGet(); await loadingA;
  assert.equal(api.readBudgetData().settings.displayName, 'Account B');
  assert.equal(expenses.getState().expenses.length, 0);
  // Shared session cookie changed while tab still believes it is B: do not save to A.
  activeUser = 'A';
  expenses.getState().addExpense({ ...expense, description: 'Wrong session' }); await save();
  assert.equal(sync.getState().status, 'session-changed');
  assert.equal(database.get('A').data.expenses.length, 4);
  // B's rejected draft stays scoped to B and is retried only after B signs in.
  activeUser = 'B'; await start('B'); await save();
  assert.equal(database.get('B').data.expenses.length, 1);
  // A stale revision must preserve the local draft and stop automatic retries.
  database.get('B').revision++;
  expenses.getState().addExpense({ ...expense, description: 'Conflict draft' }); await save();
  assert.equal(sync.getState().status, 'conflict');
  assert.equal(expenses.getState().expenses.length, 2);
  assert.equal(JSON.parse(localStorage.getItem(api.draftKey('B'))).data.expenses.length, 2);
  // A duplicated/new tab uses a distinct document key and cannot erase B's draft.
  const oldDraftKey = api.draftKey('B');
  const tabTwo = await import(output.href + '?tab-two');
  assert.notEqual(tabTwo.draftKey('B'), oldDraftKey);
  await tabTwo.startBudgetSync('B', true);
  tabTwo.useExpenseStore.getState().addExpense({ ...expense, description: 'Other tab save' });
  await tabTwo.saveBudgetData(); tabTwo.stopBudgetSync();
  assert.equal(JSON.parse(localStorage.getItem(oldDraftKey)).data.expenses.length, 2);
  // A closed tab's data remains discoverable even with a fresh tab/sessionStorage.
  sessionValues.clear();
  const reopenedTab = await import(output.href + '?closed-tab-recovery');
  assert(reopenedTab.archivedBrowserDrafts('B').some(draft => draft.key === oldDraftKey));
  reopenedTab.stopBudgetSync();
  await start('B', true);
  assert.equal(sessionStorage.getItem('frugal:draft-pointer:B'), null, 'Discarding a draft also clears the reload pointer');
  assert.equal(expenses.getState().expenses.length, 2);
  budget.getState().setBudget(456); await save();
  assert.equal(database.get('B').data.budgetHistory.at(-1).amount, 456);
  const prior = new Date(); prior.setDate(prior.getDate() - 7);
  const date = `${prior.getFullYear()}-${String(prior.getMonth()+1).padStart(2,'0')}-${String(prior.getDate()).padStart(2,'0')}`;
  recurring.getState().addRecurring({ amount: 7, category: 'groceries', description: 'Due', frequency: 'weekly', startDate: date, active: true });
  recurring.getState().generateDueExpenses(); recurring.getState().generateDueExpenses();
  assert.equal(expenses.getState().expenses.filter(e => e.description === 'Due').length, 1);
  await save();
  const backup = JSON.parse(JSON.stringify(api.createLocalBackup()));
  assert.equal(backup.settings.displayName, 'Account B');
  const roundTrip = api.parseBackup(backup);
  assert.deepEqual(roundTrip, api.readBudgetData());
  const legacyImport = api.parseBackup({ format: 'frugal-legacy-browser-archive', version: 1, stores: {
    'weekly-budget-expenses': JSON.stringify({ state: { expenses: [backup.expenses[0]] }, version: 0 }),
  } });
  assert.equal(legacyImport.expenses.length, 1);
  assert.throws(() => api.parseBackup({ ...backup, expenses: [{ ...backup.expenses[0], amount: -3 }] }));
  api.restoreBudgetData(roundTrip); await save();
  // A save reply from the previous account must not update the next account.
  let releaseLateSave; holdPut = new Promise(resolve => { releaseLateSave = resolve; });
  expenses.getState().addExpense({ ...expense, description: 'Late B save' });
  const savingB = save();
  activeUser = 'A'; await start('A'); releaseLateSave(); await savingB;
  assert.equal(api.readBudgetData().settings.displayName, 'Account A');
  assert.equal(expenses.getState().expenses.length, 4);
  // Failed startup still permits exporting the original account's retained draft.
  activeUser = 'B'; failNextGet = true; await start('B');
  assert.equal(sync.getState().ready, false);
  assert(api.createLocalBackup().expenses.some(e => e.description === 'Late B save'));
  await start('B'); await save();
  assert.equal(database.get('B').data.expenses.filter(e => e.description === 'Late B save').length, 1);
  // A failed background session check is not a sign-out and cannot erase memory.
  api.useAuthStore.setState({ user: { id: 'B', email: 'b@example.test', name: 'B' }, loading: false });
  const normalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline session check'); };
  assert.equal(await api.useAuthStore.getState().refresh(), false);
  assert.equal(api.useAuthStore.getState().user.id, 'B');
  assert(api.readBudgetData().expenses.some(e => e.description === 'Late B save'));
  globalThis.fetch = normalFetch;
  // Invalid retained drafts are offered for export, never silently discarded.
  const damagedId = expenses.getState().expenses[0].id;
  expenses.getState().editExpense(damagedId, { ...expense, amount: 2_000_000_000 });
  await save(); stop(); await start('B');
  assert.equal(sync.getState().status, 'invalid');
  assert(api.rejectedDraftArchive().includes('2000000000'));
  await start('B', true);
  stop();
  assert.equal(expenses.getState().expenses.length, 0);
  assert.equal(localStorage.getItem('weekly-budget-expenses'), legacyValue, 'Legacy records remain unchanged');
  console.log('PASS: account isolation, stale hydration, shared-cookie change, serialized saves, lost-response replay, conflicts, retained drafts, legacy preservation and recurring idempotency');
} finally {
  api?.stopBudgetSync();
  await unlink(output);
}
