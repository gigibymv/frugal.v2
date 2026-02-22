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

    // Register auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user ?? null });

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
        set({ loading: false });
      }

      // Clean up OAuth query params after sign-in
      if (event === "SIGNED_IN") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("code") || window.location.hash) {
          url.searchParams.delete("code");
          window.history.replaceState(null, "", url.pathname);
        }
      }
    });

    // Explicitly handle PKCE code exchange if ?code= is in the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("PKCE code exchange failed:", error.message);
        set({ error: error.message, loading: false });
      }
      return;
    }

    // No code in URL — check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });
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
      options: { redirectTo: window.location.origin + "/" },
    });
    if (error) {
      set({ error: error.message });
    }
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Clear local storage for user-specific stores (keep frugal-dark-mode as UI preference)
    localStorage.removeItem("weekly-budget-budget");
    localStorage.removeItem("weekly-budget-expenses");
    localStorage.removeItem("weekly-budget-recurring");
    localStorage.removeItem("frugal-oneoff-expenses");
    localStorage.removeItem("frugal-settings");
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
