import { useMemo } from "react";
import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getWeekRange, isDateInRange } from "@/lib/date-utils";

export function useWeekData() {
  const selectedWeekOffset = useUIStore((s) => s.selectedWeekOffset);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const { start, end } = useMemo(
    () => getWeekRange(selectedWeekOffset, weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6),
    [selectedWeekOffset, weekStartDay]
  );

  const budgetHistory = useBudgetStore((s) => s.budgetHistory);
  const expenses = useExpenseStore((s) => s.expenses);

  return useMemo(() => {
    // Compute current budget
    const today = new Date().toISOString().slice(0, 10);
    const active = budgetHistory
      .filter((b) => b.effectiveFrom <= today)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const budget = active[0]?.amount ?? 500;

    // Filter expenses for this week
    const weekExpenses = expenses
      .filter((e) => isDateInRange(e.date, start, end))
      .sort((a, b) => b.date.localeCompare(a.date));

    const spent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

    const spentByCategory: Record<string, number> = {};
    for (const e of weekExpenses) {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    }

    return {
      budget,
      spent,
      remaining,
      percentUsed,
      expenses: weekExpenses,
      spentByCategory,
      weekStart: start,
      weekEnd: end,
    };
  }, [budgetHistory, expenses, start, end]);
}
