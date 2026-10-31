import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';

// Isolated in-memory storage: never reads or changes a real browser profile.
const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };
const seed = (key, state) => localStorage.setItem(key, JSON.stringify({ state, version: 0 }));
const existing = { id: 'existing', amount: 12.5, category: 'groceries', description: 'Existing record', date: '2026-10-30', createdAt: '2026-10-30T12:00:00Z' };
seed('weekly-budget-expenses', { expenses: [existing] });
seed('weekly-budget-budget', { budgetHistory: [{ amount: 321, effectiveFrom: '2020-01-01', updatedAt: '2020-01-01T00:00:00Z' }] });
seed('frugal-oneoff-expenses', { oneOffExpenses: [{ ...existing, id: 'oneoff' }] });
seed('frugal-settings', { displayName: 'Local user', weekStartDay: 0 });
seed('weekly-budget-recurring', { recurringExpenses: [{ id: 'recurring', amount: 5, category: 'groceries', description: 'Recurring record', frequency: 'weekly', startDate: '2020-01-01', lastGenerated: '2020-01-01', active: false, createdAt: '2020-01-01T00:00:00Z' }] });
const output = new URL('./.local-stores-check.mjs', import.meta.url);
await build({
  stdin: { contents: [
    "export { createLocalBackup } from './src/lib/backup.ts';",
    "export { useExpenseStore } from './src/store/expenseStore.ts';",
    "export { useBudgetStore } from './src/store/budgetStore.ts';",
    "export { useOneOffExpenseStore } from './src/store/oneOffExpenseStore.ts';",
    "export { useSettingsStore } from './src/store/settingsStore.ts';",
    "export { useRecurringExpenseStore } from './src/store/recurringExpenseStore.ts';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
  tsconfig: 'tsconfig.app.json', outfile: output.pathname,
});
try {
  const { createLocalBackup, useExpenseStore: expenses, useBudgetStore: budget, useOneOffExpenseStore: oneOff,
    useSettingsStore: settings, useRecurringExpenseStore: recurring } = await import(output.href);
  assert.deepEqual(expenses.getState().expenses, [existing]);
  assert.equal(budget.getState().getCurrentBudget(), 321);
  assert.equal(oneOff.getState().oneOffExpenses[0].id, 'oneoff');
  assert.equal(settings.getState().displayName, 'Local user');
  assert.equal(settings.getState().weekStartDay, 0);
  recurring.getState().generateDueExpenses();
  assert.equal(expenses.getState().expenses.length, 1, 'Inactive recurring record stays inactive');
  expenses.getState().addExpense({ ...existing, description: 'New record' });
  const addedId = expenses.getState().expenses[0].id;
  expenses.getState().editExpense(addedId, { ...existing, amount: 25 });
  assert.equal(expenses.getState().expenses[0].amount, 25);
  expenses.getState().deleteExpense(addedId);
  budget.getState().setBudget(456);
  assert.equal(budget.getState().getCurrentBudget(), 456);
  assert.equal(JSON.parse(localStorage.getItem('weekly-budget-budget')).state.budgetHistory.at(-1).amount, 456);
  // A due recurring record runs once even when startup effects repeat.
  const today = new Date();
  const prior = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const date = `${prior.getFullYear()}-${String(prior.getMonth()+1).padStart(2,'0')}-${String(prior.getDate()).padStart(2,'0')}`;
  recurring.getState().addRecurring({ amount: 7, category: 'groceries', description: 'Due record', frequency: 'weekly', startDate: date, active: true });
  recurring.getState().generateDueExpenses();
  recurring.getState().generateDueExpenses();
  assert.equal(expenses.getState().expenses.filter(e => e.description === 'Due record').length, 1);
  seed('weekly-budget-expenses', { expenses: [existing] });
  await expenses.persist.rehydrate();
  assert.deepEqual(expenses.getState().expenses, [existing]);
  const backup = JSON.parse(JSON.stringify(createLocalBackup()));
  assert.deepEqual(backup.expenses, [existing]);
  assert.equal(backup.settings.displayName, 'Local user');
  assert.equal(backup.oneOffExpenses[0].id, 'oneoff');
  assert.equal(backup.recurringExpenses.length, 2);
  assert.equal(backup.budgetHistory.at(-1).amount, 456);
  console.log('PASS: legacy storage hydration, budget/expense CRUD, persistence, recurring startup idempotency; no backend required');
} finally {
  await unlink(output);
}
