import { create } from "zustand";
import type { TabId } from "@/types";
import { getWeekRange } from "@/lib/date-utils";

interface UIState {
  activeTab: TabId;
  showAddExpenseModal: boolean;
  showEditBudgetModal: boolean;
  showAuthModal: boolean;
  selectedWeekOffset: number;
  setActiveTab: (tab: TabId) => void;
  toggleAddExpenseModal: (show?: boolean) => void;
  toggleEditBudgetModal: (show?: boolean) => void;
  toggleAuthModal: (show?: boolean) => void;
  setWeekOffset: (offset: number) => void;
  getWeekRange: () => { start: Date; end: Date };
}

export const useUIStore = create<UIState>()((set, get) => ({
  activeTab: "dashboard",
  showAddExpenseModal: false,
  showEditBudgetModal: false,
  showAuthModal: false,
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

  toggleAuthModal: (show) =>
    set((state) => ({
      showAuthModal: show !== undefined ? show : !state.showAuthModal,
    })),

  setWeekOffset: (offset) => set({ selectedWeekOffset: offset }),

  getWeekRange: () => getWeekRange(get().selectedWeekOffset),
}));
