import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OneOffExpense } from "@/types";
import { syncOneOffExpensesToSupabase } from "@/lib/sync";
import { useAuthStore } from "@/store/authStore";

interface OneOffExpenseState {
  oneOffExpenses: OneOffExpense[];
  addOneOffExpense: (data: Omit<OneOffExpense, "id" | "createdAt">) => void;
  editOneOffExpense: (id: string, data: Omit<OneOffExpense, "id" | "createdAt">) => void;
  deleteOneOffExpense: (id: string) => void;
}

export const useOneOffExpenseStore = create<OneOffExpenseState>()(
  persist(
    (set) => ({
      oneOffExpenses: [],

      addOneOffExpense: (data) => {
        const expense: OneOffExpense = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const newExpenses = [expense, ...state.oneOffExpenses];
          const user = useAuthStore.getState().user;
          if (user) {
            syncOneOffExpensesToSupabase(user.id, newExpenses);
          }
          return { oneOffExpenses: newExpenses };
        });
      },

      editOneOffExpense: (id, data) => {
        set((state) => {
          const newExpenses = state.oneOffExpenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          );
          const user = useAuthStore.getState().user;
          if (user) {
            syncOneOffExpensesToSupabase(user.id, newExpenses);
          }
          return { oneOffExpenses: newExpenses };
        });
      },

      deleteOneOffExpense: (id) => {
        set((state) => {
          const newExpenses = state.oneOffExpenses.filter((e) => e.id !== id);
          const user = useAuthStore.getState().user;
          if (user) {
            syncOneOffExpensesToSupabase(user.id, newExpenses);
          }
          return { oneOffExpenses: newExpenses };
        });
      },
    }),
    { name: "frugal-oneoff-expenses" }
  )
);
