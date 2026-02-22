import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  displayName: string;
  weekStartDay: number; // 0=Sun, 1=Mon, ..., 6=Sat
  setDisplayName: (name: string) => void;
  setWeekStartDay: (day: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      displayName: "",
      weekStartDay: 1, // Monday default
      setDisplayName: (name) => set({ displayName: name }),
      setWeekStartDay: (day) => set({ weekStartDay: day }),
    }),
    { name: "frugal-settings" }
  )
);
