import type { BudgetSnapshot } from "../../shared/snapshot";
import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import { useOneOffExpenseStore } from "@/store/oneOffExpenseStore";
import { useSettingsStore } from "@/store/settingsStore";
import { DEFAULT_BUDGET } from "@/lib/constants";

export function emptyBudgetData(): BudgetSnapshot {
  return {
    budgetHistory: [{ amount: DEFAULT_BUDGET, effectiveFrom: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString() }],
    expenses: [], recurringExpenses: [], oneOffExpenses: [],
    settings: { displayName: "", weekStartDay: 1 },
  };
}

export function readBudgetData(): BudgetSnapshot {
  const { displayName, weekStartDay } = useSettingsStore.getState();
  return {
    budgetHistory: useBudgetStore.getState().budgetHistory,
    expenses: useExpenseStore.getState().expenses,
    recurringExpenses: useRecurringExpenseStore.getState().recurringExpenses,
    oneOffExpenses: useOneOffExpenseStore.getState().oneOffExpenses,
    settings: { displayName, weekStartDay },
  };
}

export function applyBudgetData(data: BudgetSnapshot) {
  useBudgetStore.setState({ budgetHistory: data.budgetHistory });
  useExpenseStore.setState({ expenses: data.expenses });
  useRecurringExpenseStore.setState({ recurringExpenses: data.recurringExpenses });
  useOneOffExpenseStore.setState({ oneOffExpenses: data.oneOffExpenses });
  useSettingsStore.setState(data.settings);
}

export function subscribeBudgetData(listener: () => void) {
  const stores = [useBudgetStore, useExpenseStore, useRecurringExpenseStore, useOneOffExpenseStore, useSettingsStore];
  const stops = stores.map(store => store.subscribe(listener));
  return () => stops.forEach(stop => stop());
}
