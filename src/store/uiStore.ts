import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Expense, TabId } from "@/types";
import { getWeekRange } from "@/lib/date-utils";

interface UIState {
  activeTab: TabId;
  showAddExpenseModal: boolean;
  showEditBudgetModal: boolean;
  editingExpense: Expense | null;
  selectedWeekOffset: number;
  darkMode: boolean;
  setActiveTab: (tab: TabId) => void;
  toggleAddExpenseModal: (show?: boolean) => void;
  toggleEditBudgetModal: (show?: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
  setWeekOffset: (offset: number) => void;
  getWeekRange: () => { start: Date; end: Date };
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>()(subscribeWithSelector((set, get) => ({
  activeTab: "dashboard",
  showAddExpenseModal: false,
  showEditBudgetModal: false,
  editingExpense: null,
  selectedWeekOffset: 0,
  darkMode: localStorage.getItem("frugal-dark-mode") === "true",

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleAddExpenseModal: (show) =>
    set((state) => ({
      showAddExpenseModal: show !== undefined ? show : !state.showAddExpenseModal,
    })),

  toggleEditBudgetModal: (show) =>
    set((state) => ({
      showEditBudgetModal: show !== undefined ? show : !state.showEditBudgetModal,
    })),

  setEditingExpense: (expense) => set({ editingExpense: expense }),

  setWeekOffset: (offset) => set({ selectedWeekOffset: offset }),

  getWeekRange: () => getWeekRange(get().selectedWeekOffset),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("frugal-dark-mode", String(next));
      return { darkMode: next };
    }),
})));
