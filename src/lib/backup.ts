import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import { useOneOffExpenseStore } from "@/store/oneOffExpenseStore";
import { useSettingsStore } from "@/store/settingsStore";

export function createLocalBackup() {
  const { displayName, weekStartDay } = useSettingsStore.getState();
  return {
    format: "frugal-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    budgetHistory: useBudgetStore.getState().budgetHistory,
    expenses: useExpenseStore.getState().expenses,
    recurringExpenses: useRecurringExpenseStore.getState().recurringExpenses,
    oneOffExpenses: useOneOffExpenseStore.getState().oneOffExpenses,
    settings: { displayName, weekStartDay },
  };
}

export function exportLocalBackup() {
  const blob = new Blob([JSON.stringify(createLocalBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frugal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  // Give the browser time to begin the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
