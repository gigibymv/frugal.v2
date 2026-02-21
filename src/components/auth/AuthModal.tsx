import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

export function AuthModal() {
  const { signUp, signIn, error, clearError } = useAuthStore();
  const { showAuthModal, toggleAuthModal } = useUIStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function reset() {
    setEmail("");
    setPassword("");
    setSuccess("");
    clearError();
  }

  function switchMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    if (mode === "signup") {
      await signUp(email, password);
      if (!useAuthStore.getState().error) {
        setSuccess("Check your email to confirm your account!");
      }
    } else {
      await signIn(email, password);
      if (!useAuthStore.getState().error) {
        toggleAuthModal(false);
        reset();
      }
    }

    setLoading(false);
  }

  return (
    <Dialog
      open={showAuthModal}
      onOpenChange={(open) => {
        toggleAuthModal(open);
        if (!open) reset();
      }}
    >
      <DialogContent
        className="retro-card bg-[#FFFEF9] border-2 border-foreground p-0 gap-0 sm:max-w-sm"
        style={{ boxShadow: "6px 6px 0px #1A1A2E" }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-center">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "signin"
              ? "Sign in to sync your budget across devices"
              : "Sign up to save your budget in the cloud"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-2">
          <div className="space-y-2">
            <label
              htmlFor="auth-email"
              className="text-sm font-semibold text-[#1A1A2E]"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 border-2 border-foreground rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9E8F] focus:ring-offset-1"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="auth-password"
              className="text-sm font-semibold text-[#1A1A2E]"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2.5 border-2 border-foreground rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9E8F] focus:ring-offset-1"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium text-center">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-[#2D9E8F] font-medium text-center">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="retro-btn w-full bg-[#2D9E8F] text-white font-semibold py-2.5 disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "No account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-[#2D9E8F] font-semibold hover:underline"
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
