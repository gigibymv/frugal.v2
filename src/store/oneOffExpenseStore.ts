import { create } from "zustand";
import type { OneOffExpense } from "@/types";

interface OneOffExpenseState {
  oneOffExpenses: OneOffExpense[];
  addOneOffExpense: (data: Omit<OneOffExpense, "id" | "createdAt">) => void;
  editOneOffExpense: (id: string, data: Omit<OneOffExpense, "id" | "createdAt">) => void;
  deleteOneOffExpense: (id: string) => void;
}

export const useOneOffExpenseStore = create<OneOffExpenseState>()(
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
          return { oneOffExpenses: newExpenses };
        });
      },

      editOneOffExpense: (id, data) => {
        set((state) => {
          const newExpenses = state.oneOffExpenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          );
          return { oneOffExpenses: newExpenses };
        });
      },

      deleteOneOffExpense: (id) => {
        set((state) => {
          const newExpenses = state.oneOffExpenses.filter((e) => e.id !== id);
          return { oneOffExpenses: newExpenses };
        });
      },
    })
);
