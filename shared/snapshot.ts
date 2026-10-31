import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");
const timestamp = z.iso.datetime({ offset: true });
export const MAX_AMOUNT = 1_000_000_000;
export const moneySchema = z.number().finite().min(0).max(MAX_AMOUNT);
const money = moneySchema;
const id = z.string().min(1).max(128);
const category = z.enum(["groceries", "transport", "entertainment", "dining", "bills", "health", "shopping", "other"]);
const oneOffCategory = z.enum(["gifts", "shopping", "entertainment", "travel", "other"]);
const expense = z.object({
  id,
  amount: money,
  category,
  description: z.string().max(2_000),
  date: day,
  createdAt: timestamp,
}).strict();
const oneOffExpense = expense.extend({ category: oneOffCategory });
const recurring = z.object({
  id,
  amount: money,
  category,
  description: z.string().max(2_000),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: day,
  lastGenerated: day.nullable(),
  active: z.boolean(),
  createdAt: timestamp,
}).strict();
const uniqueIds = <T extends { id: string }>(rows: T[]) => new Set(rows.map((row) => row.id)).size === rows.length;

export const snapshotSchema = z.object({
  budgetHistory: z.array(z.object({
    amount: money,
    effectiveFrom: day,
    updatedAt: timestamp,
  }).strict()).max(5_000),
  expenses: z.array(expense).max(20_000).refine(uniqueIds, "Duplicate expense IDs"),
  recurringExpenses: z.array(recurring).max(1_000).refine(uniqueIds, "Duplicate recurring IDs"),
  oneOffExpenses: z.array(oneOffExpense).max(10_000).refine(uniqueIds, "Duplicate one-off IDs"),
  settings: z.object({
    displayName: z.string().max(100),
    weekStartDay: z.number().int().min(0).max(6),
  }).strict(),
}).strict();

export type BudgetSnapshot = z.infer<typeof snapshotSchema>;

export const saveStateSchema = z.object({
  ownerId: id,
  mutationId: z.uuid(),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  data: snapshotSchema,
}).strict();
