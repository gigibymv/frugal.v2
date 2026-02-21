import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "google") => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signUp: async (email, password) => {
    if (!supabase) {
      set({ error: "Supabase not configured" });
      return;
    }
    set({ error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({ error: "Supabase not configured" });
      return;
    }
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message });
    }
  },

  signInWithOAuth: async (provider) => {
    if (!supabase) {
      set({ error: "Supabase not configured" });
      return;
    }
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      set({ error: error.message });
    }
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Clear local storage for stores
    localStorage.removeItem("weekly-budget-budget");
    localStorage.removeItem("weekly-budget-expenses");
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
