import { create } from "zustand";
import type { Expense, TabId } from "@/types";
import { getWeekRange } from "@/lib/date-utils";

interface UIState {
  activeTab: TabId;
  showAddExpenseModal: boolean;
  showEditBudgetModal: boolean;
  editingExpense: Expense | null;
  selectedWeekOffset: number;
  setActiveTab: (tab: TabId) => void;
  toggleAddExpenseModal: (show?: boolean) => void;
  toggleEditBudgetModal: (show?: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
  setWeekOffset: (offset: number) => void;
  getWeekRange: () => { start: Date; end: Date };
}

export const useUIStore = create<UIState>()((set, get) => ({
  activeTab: "dashboard",
  showAddExpenseModal: false,
  showEditBudgetModal: false,
  editingExpense: null,
  selectedWeekOffset: 0,

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
}));
