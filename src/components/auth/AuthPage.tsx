import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithOAuth("google");
    setLoading(false);
  };

  const switchMode = () => {
    clearError();
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Frugal
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="retro-card p-6 space-y-5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="retro-btn w-full flex items-center justify-center gap-3 bg-card text-foreground px-4 py-3 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-foreground rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-foreground rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="retro-btn w-full bg-primary text-primary-foreground px-4 py-3 disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </div>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
