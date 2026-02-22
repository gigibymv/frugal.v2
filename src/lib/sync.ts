import { supabase } from "@/lib/supabase";
import type { Expense, OneOffExpense, RecurringExpense, WeeklyBudget } from "@/types";

export async function syncBudgetsToSupabase(
  userId: string,
  budgetHistory: WeeklyBudget[]
) {
  if (!supabase) return;

  const rows = budgetHistory.map((b) => ({
    user_id: userId,
    amount: b.amount,
    effective_from: b.effectiveFrom,
    updated_at: b.updatedAt,
  }));

  // Delete existing and replace
  await supabase.from("budgets").delete().eq("user_id", userId);
  if (rows.length > 0) {
    await supabase.from("budgets").insert(rows);
  }
}

export async function syncExpensesToSupabase(
  userId: string,
  expenses: Expense[]
) {
  if (!supabase) return;

  const rows = expenses.map((e) => ({
    id: e.id,
    user_id: userId,
    amount: e.amount,
    category: e.category,
    description: e.description,
    date: e.date,
    created_at: e.createdAt,
  }));

  // Delete existing and replace
  await supabase.from("expenses").delete().eq("user_id", userId);
  if (rows.length > 0) {
    await supabase.from("expenses").insert(rows);
  }
}

export async function fetchBudgetsFromSupabase(
  userId: string
): Promise<WeeklyBudget[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    amount: Number(row.amount),
    effectiveFrom: row.effective_from,
    updatedAt: row.updated_at,
  }));
}

export async function fetchExpensesFromSupabase(
  userId: string
): Promise<Expense[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    description: row.description || "",
    date: row.date,
    createdAt: row.created_at,
  }));
}

export async function syncRecurringToSupabase(
  userId: string,
  recurringExpenses: RecurringExpense[]
) {
  if (!supabase) return;

  const rows = recurringExpenses.map((r) => ({
    id: r.id,
    user_id: userId,
    amount: r.amount,
    category: r.category,
    description: r.description,
    frequency: r.frequency,
    start_date: r.startDate,
    last_generated: r.lastGenerated,
    active: r.active,
    created_at: r.createdAt,
  }));

  // Delete existing and replace
  await supabase.from("recurring_expenses").delete().eq("user_id", userId);
  if (rows.length > 0) {
    await supabase.from("recurring_expenses").insert(rows);
  }
}

export async function fetchRecurringFromSupabase(
  userId: string
): Promise<RecurringExpense[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    description: row.description || "",
    frequency: row.frequency,
    startDate: row.start_date,
    lastGenerated: row.last_generated,
    active: row.active,
    createdAt: row.created_at,
  }));
}

export async function syncOneOffExpensesToSupabase(
  userId: string,
  expenses: OneOffExpense[]
) {
  if (!supabase) return;
  const rows = expenses.map((e) => ({
    id: e.id,
    user_id: userId,
    amount: e.amount,
    category: e.category,
    description: e.description,
    date: e.date,
    created_at: e.createdAt,
  }));
  await supabase.from("oneoff_expenses").delete().eq("user_id", userId);
  if (rows.length > 0) {
    await supabase.from("oneoff_expenses").insert(rows);
  }
}

export async function fetchOneOffExpensesFromSupabase(
  userId: string
): Promise<OneOffExpense[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("oneoff_expenses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    description: row.description || "",
    date: row.date,
    createdAt: row.created_at,
  }));
}

export async function syncFromRemote(userId: string) {
  const [budgets, expenses, recurring, oneOffExpenses] = await Promise.all([
    fetchBudgetsFromSupabase(userId),
    fetchExpensesFromSupabase(userId),
    fetchRecurringFromSupabase(userId),
    fetchOneOffExpensesFromSupabase(userId),
  ]);

  const { useBudgetStore } = await import("@/store/budgetStore");
  const { useExpenseStore } = await import("@/store/expenseStore");
  const { useRecurringExpenseStore } = await import("@/store/recurringExpenseStore");
  const { useOneOffExpenseStore } = await import("@/store/oneOffExpenseStore");

  if (budgets.length > 0) {
    useBudgetStore.setState({ budgetHistory: budgets });
  }
  if (expenses.length > 0) {
    useExpenseStore.setState({ expenses });
  }
  if (recurring.length > 0) {
    useRecurringExpenseStore.setState({ recurringExpenses: recurring });
  }
  if (oneOffExpenses.length > 0) {
    useOneOffExpenseStore.setState({ oneOffExpenses });
  }
}

export async function syncToRemote(userId: string) {
  const { useBudgetStore } = await import("@/store/budgetStore");
  const { useExpenseStore } = await import("@/store/expenseStore");
  const { useRecurringExpenseStore } = await import("@/store/recurringExpenseStore");
  const { useOneOffExpenseStore } = await import("@/store/oneOffExpenseStore");

  const budgetHistory = useBudgetStore.getState().budgetHistory;
  const expenses = useExpenseStore.getState().expenses;
  const recurringExpenses = useRecurringExpenseStore.getState().recurringExpenses;
  const oneOffExpenses = useOneOffExpenseStore.getState().oneOffExpenses;

  await Promise.all([
    syncBudgetsToSupabase(userId, budgetHistory),
    syncExpensesToSupabase(userId, expenses),
    syncRecurringToSupabase(userId, recurringExpenses),
    syncOneOffExpensesToSupabase(userId, oneOffExpenses),
  ]);
}
