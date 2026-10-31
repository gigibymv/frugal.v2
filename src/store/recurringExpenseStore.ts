import { create } from "zustand";
import type { RecurringExpense } from "@/types";
import { useExpenseStore } from "@/store/expenseStore";
import { addDays, addMonths, parseISO, isBefore, startOfDay, format } from "date-fns";

interface RecurringExpenseState {
  recurringExpenses: RecurringExpense[];
  addRecurring: (data: Omit<RecurringExpense, "id" | "createdAt" | "lastGenerated">) => void;
  editRecurring: (id: string, data: Partial<Omit<RecurringExpense, "id" | "createdAt">>) => void;
  deleteRecurring: (id: string) => void;
  toggleActive: (id: string) => void;
  generateDueExpenses: () => void;
}

function getNextDueDate(reference: string, frequency: RecurringExpense["frequency"]): Date {
  const ref = parseISO(reference);
  switch (frequency) {
    case "weekly":
      return addDays(ref, 7);
    case "biweekly":
      return addDays(ref, 14);
    case "monthly":
      return addMonths(ref, 1);
  }
}

export const useRecurringExpenseStore = create<RecurringExpenseState>()(
    (set) => ({
      recurringExpenses: [],

      addRecurring: (data) => {
        const recurring: RecurringExpense = {
          ...data,
          id: crypto.randomUUID(),
          lastGenerated: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const newList = [recurring, ...state.recurringExpenses];
          return { recurringExpenses: newList };
        });
      },

      editRecurring: (id, data) => {
        set((state) => {
          const newList = state.recurringExpenses.map((r) =>
            r.id === id ? { ...r, ...data } : r
          );
          return { recurringExpenses: newList };
        });
      },

      deleteRecurring: (id) => {
        set((state) => {
          const newList = state.recurringExpenses.filter((r) => r.id !== id);
          return { recurringExpenses: newList };
        });
      },

      toggleActive: (id) => {
        set((state) => {
          const newList = state.recurringExpenses.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r
          );
          return { recurringExpenses: newList };
        });
      },

      generateDueExpenses: () => {
        const today = startOfDay(new Date());
        const addExpense = useExpenseStore.getState().addExpense;

        set((state) => {
          const newList = state.recurringExpenses.map((r) => {
            if (!r.active) return r;

            const reference = r.lastGenerated || r.startDate;
            let nextDue = getNextDueDate(reference, r.frequency);
            let lastGenerated = r.lastGenerated;

            // Generate expenses for all missed periods
            while (isBefore(nextDue, today) || nextDue.getTime() === today.getTime()) {
              addExpense({
                amount: r.amount,
                category: r.category,
                description: r.description,
                date: format(nextDue, "yyyy-MM-dd"),
              });
              lastGenerated = format(nextDue, "yyyy-MM-dd");
              nextDue = getNextDueDate(lastGenerated, r.frequency);
            }

            if (lastGenerated !== r.lastGenerated) {
              return { ...r, lastGenerated };
            }
            return r;
          });

          // Reopening a tab with nothing due must not create a cloud write.
          return newList.some((item, index) => item !== state.recurringExpenses[index])
            ? { recurringExpenses: newList }
            : state;
        });
      },
    })
);
