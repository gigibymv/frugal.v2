import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Expense, TabId, OneOffExpense } from "@/types";
import { getWeekRange } from "@/lib/date-utils";
import { useSettingsStore } from "@/store/settingsStore";

interface UIState {
  activeTab: TabId;
  showAddExpenseModal: boolean;
  showEditBudgetModal: boolean;
  editingExpense: Expense | null;
  selectedWeekOffset: number;
  darkMode: boolean;
  showSettingsModal: boolean;
  showOneOffExpenseModal: boolean;
  editingOneOffExpense: OneOffExpense | null;
  setActiveTab: (tab: TabId) => void;
  toggleAddExpenseModal: (show?: boolean) => void;
  toggleEditBudgetModal: (show?: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
  setWeekOffset: (offset: number) => void;
  getWeekRange: () => { start: Date; end: Date };
  toggleDarkMode: () => void;
  toggleSettingsModal: (show?: boolean) => void;
  toggleOneOffExpenseModal: (show?: boolean) => void;
  setEditingOneOffExpense: (expense: OneOffExpense | null) => void;
}

export const useUIStore = create<UIState>()(subscribeWithSelector((set, get) => ({
  activeTab: "dashboard",
  showAddExpenseModal: false,
  showEditBudgetModal: false,
  editingExpense: null,
  selectedWeekOffset: 0,
  darkMode: localStorage.getItem("frugal-dark-mode") === "true",
  showSettingsModal: false,
  showOneOffExpenseModal: false,
  editingOneOffExpense: null,

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

  getWeekRange: () => {
    const weekStartDay = useSettingsStore.getState().weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    return getWeekRange(get().selectedWeekOffset, weekStartDay);
  },

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("frugal-dark-mode", String(next));
      return { darkMode: next };
    }),

  toggleSettingsModal: (show) =>
    set((state) => ({
      showSettingsModal: show !== undefined ? show : !state.showSettingsModal,
    })),

  toggleOneOffExpenseModal: (show) =>
    set((state) => ({
      showOneOffExpenseModal: show !== undefined ? show : !state.showOneOffExpenseModal,
    })),

  setEditingOneOffExpense: (expense) => set({ editingOneOffExpense: expense }),
})));
