import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CategoryId, Expense } from "@/types";
import { isDateInRange } from "@/lib/date-utils";
import { syncExpensesToSupabase } from "@/lib/sync";
import { useAuthStore } from "@/store/authStore";

interface ExpenseState {
  expenses: Expense[];
  addExpense: (data: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  getWeeklyExpenses: (start: Date, end: Date) => Expense[];
  getWeeklyTotal: (start: Date, end: Date) => number;
  getSpentByCategory: (start: Date, end: Date) => Record<CategoryId, number>;
  getWeekOverWeekData: (
    currentWeekStart: Date,
    currentWeekEnd: Date,
    weeks: number
  ) => { label: string; total: number }[];
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (data) => {
        const expense: Expense = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const newExpenses = [expense, ...state.expenses];
          const user = useAuthStore.getState().user;
          if (user) {
            syncExpensesToSupabase(user.id, newExpenses);
          }
          return { expenses: newExpenses };
        });
      },

      deleteExpense: (id) => {
        set((state) => {
          const newExpenses = state.expenses.filter((e) => e.id !== id);
          const user = useAuthStore.getState().user;
          if (user) {
            syncExpensesToSupabase(user.id, newExpenses);
          }
          return { expenses: newExpenses };
        });
      },

      getWeeklyExpenses: (start, end) => {
        return get()
          .expenses.filter((e) => isDateInRange(e.date, start, end))
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      getWeeklyTotal: (start, end) => {
        return get()
          .expenses.filter((e) => isDateInRange(e.date, start, end))
          .reduce((sum, e) => sum + e.amount, 0);
      },

      getSpentByCategory: (start, end) => {
        const weekExpenses = get().expenses.filter((e) =>
          isDateInRange(e.date, start, end)
        );
        const result = {} as Record<CategoryId, number>;
        for (const e of weekExpenses) {
          result[e.category] = (result[e.category] || 0) + e.amount;
        }
        return result;
      },

      getWeekOverWeekData: (currentWeekStart, currentWeekEnd, weeks) => {
        const data: { label: string; total: number }[] = [];
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;

        for (let i = weeks - 1; i >= 0; i--) {
          const start = new Date(currentWeekStart.getTime() - i * msPerWeek);
          const end = new Date(currentWeekEnd.getTime() - i * msPerWeek);
          const total = get()
            .expenses.filter((e) => isDateInRange(e.date, start, end))
            .reduce((sum, e) => sum + e.amount, 0);

          const label =
            i === 0
              ? "This Week"
              : i === 1
                ? "Last Week"
                : `${i}w ago`;
          data.push({ label, total });
        }
        return data;
      },
    }),
    { name: "weekly-budget-expenses" }
  )
);
