import { useState } from "react";
import { exportLegacyBackup, hasLegacyData } from "@/lib/backup";
import { useAuthStore } from "@/store/authStore";

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp, busy, error, clearError } = useAuthStore();
  const [legacyAvailable] = useState(hasLegacyData);
  const signingUp = mode === "signup";
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Frugal</h1>
          <p className="text-muted-foreground text-sm">{signingUp ? "Create your account" : "Welcome back"}</p>
        </div>
        <p className="text-center text-xs text-muted-foreground">Previously used Frugal? Create a new account for this version. Previous account data is not imported automatically.</p>
        <div className="retro-card p-6 space-y-5">
          <form onSubmit={e => { e.preventDefault(); void (signingUp ? signUp(email, password) : signIn(email, password)); }} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
              <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-foreground rounded-lg bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
              <input id="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} required minLength={signingUp ? 8 : 1} maxLength={128} value={password} disabled={busy} onChange={e => setPassword(e.target.value)} className="w-full border-2 border-foreground rounded-lg bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {signingUp && <p className="text-xs text-muted-foreground">At least 8 characters</p>}
            </div>
            {error && <p role="alert" className="text-destructive text-sm font-medium">{error}</p>}
            <button type="submit" disabled={busy} className="retro-btn w-full bg-primary text-primary-foreground px-4 py-3 disabled:opacity-50">{busy ? "Please wait…" : signingUp ? "Create Account" : "Sign In"}</button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {signingUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" disabled={busy} onClick={() => { clearError(); setPassword(""); setMode(signingUp ? "signin" : "signup"); }} className="text-primary font-semibold hover:underline">{signingUp ? "Sign In" : "Sign Up"}</button>
        </p>
        {legacyAvailable && <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>Previous browser data is kept separately from your new account.</p>
          <button type="button" onClick={exportLegacyBackup} className="text-primary underline">Download previous browser data</button>
        </div>}
      </div>
    </div>
  );
}
