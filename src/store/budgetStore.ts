import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeeklyBudget } from "@/types";
import { DEFAULT_BUDGET } from "@/lib/constants";
import { syncBudgetsToSupabase } from "@/lib/sync";
import { useAuthStore } from "@/store/authStore";

interface BudgetState {
  budgetHistory: WeeklyBudget[];
  setBudget: (amount: number) => void;
  getCurrentBudget: () => number;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgetHistory: [
        {
          amount: DEFAULT_BUDGET,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        },
      ],

      setBudget: (amount: number) => {
        const entry: WeeklyBudget = {
          amount,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          const newHistory = [...state.budgetHistory, entry];
          // Sync to Supabase if authenticated
          const user = useAuthStore.getState().user;
          if (user) {
            syncBudgetsToSupabase(user.id, newHistory);
          }
          return { budgetHistory: newHistory };
        });
      },

      getCurrentBudget: () => {
        const { budgetHistory } = get();
        if (budgetHistory.length === 0) return DEFAULT_BUDGET;
        const today = new Date().toISOString().slice(0, 10);
        const active = budgetHistory
          .filter((b) => b.effectiveFrom <= today)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return active[0]?.amount ?? DEFAULT_BUDGET;
      },
    }),
    { name: "weekly-budget-budget" }
  )
);
