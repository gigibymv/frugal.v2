import { create } from "zustand";
import { authRequest, type AccountUser } from "@/lib/auth-client";
import { stopBudgetSync, saveBudgetData, canLeaveBudgetDraft } from "@/lib/account-sync";

interface AuthState {
  user: AccountUser | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}
let initialRequest: Promise<void> | undefined;
let generation = 0;
function notifyAuthChange() {
  try { localStorage.setItem("frugal:auth-event", crypto.randomUUID()); }
  catch { /* Session ownership is also rechecked on visibility and every API call. */ }
}
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null, loading: true, busy: false, error: null,
  initialize: () => initialRequest ??= get().refresh().then(() => {}),
  refresh: async () => {
    const current = ++generation;
    try {
      const session = await authRequest<{ user: AccountUser } | null>("get-session");
      if (current !== generation) return false;
      const next = session?.user ?? null;
      if (get().user?.id !== next?.id) stopBudgetSync();
      set({ user: next, loading: false, busy: false, error: null });
      return true;
    } catch {
      if (current !== generation) return false;
      // A failed check is not evidence of sign-out. Retain the in-memory draft.
      set({ loading: false, busy: false, error: "Could not check your session. Check your connection and retry." });
      return false;
    }
  },
  signUp: async (email, password) => {
    const current = ++generation;
    set({ busy: true, error: null });
    try {
      const result = await authRequest<{ user: AccountUser }>("sign-up/email", { email: email.trim(), password, name: email.trim().split("@")[0] });
      if (current !== generation) return;
      stopBudgetSync();
      set({ user: result.user, loading: false });
      notifyAuthChange();
    } catch (error) {
      if (current === generation) set({ error: error instanceof Error ? error.message : "Could not create your account." });
    } finally { if (current === generation) set({ busy: false }); }
  },
  signIn: async (email, password) => {
    const current = ++generation;
    set({ busy: true, error: null });
    try {
      const result = await authRequest<{ user: AccountUser }>("sign-in/email", { email: email.trim(), password });
      if (current !== generation) return;
      stopBudgetSync();
      set({ user: result.user, loading: false });
      notifyAuthChange();
    } catch (error) {
      if (current === generation) set({ error: error instanceof Error ? error.message : "Could not sign in." });
    } finally { if (current === generation) set({ busy: false }); }
  },
  signOut: async () => {
    const current = ++generation;
    set({ busy: true, error: null });
    try {
      await saveBudgetData();
      if (!canLeaveBudgetDraft()) {
        set({ error: "Your changes could not be saved in this browser. Download your draft before signing out.", busy: false });
        return;
      }
      await authRequest("sign-out", {});
      if (current !== generation) return;
      stopBudgetSync();
      set({ user: null, loading: false });
      notifyAuthChange();
    } catch {
      if (current === generation) set({ error: "Could not sign out. Please try again." });
    } finally { if (current === generation) set({ busy: false }); }
  },
  clearError: () => set({ error: null }),
}));
