import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSyncStore, archivedBrowserDrafts } from "@/lib/account-sync";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";

export function Header() {
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const busy = useAuthStore(s => s.busy);
  const error = useAuthStore(s => s.error);
  const archived = user ? archivedBrowserDrafts(user.id) : [];
  const status = useSyncStore(s => s.status);
  const toggleSettingsModal = useUIStore((s) => s.toggleSettingsModal);
  const displayName = useSettingsStore((s) => s.displayName);

  return (
    <header className="sticky top-0 z-30 bg-background border-b-2 border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Frugal
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSettingsModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 mr-1 hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary max-w-[100px] truncate">
              {displayName || user?.name || "Settings"}
            </span>
          </button>
          <button onClick={() => { void signOut(); }} disabled={busy} className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50" aria-label="Sign out">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      {archived.length > 0 && <button className="block mx-auto max-w-md px-4 pb-2 text-xs text-primary underline" onClick={() => toggleSettingsModal(true)}>Review {archived.length} other browser draft{archived.length === 1 ? "" : "s"}</button>}
      {error && <p role="alert" className="mx-auto max-w-md px-4 pb-2 text-sm text-destructive">{error}</p>}
      {(status === "saving" || status === "ready" || status === "pending") && <p className="mx-auto max-w-md px-4 pb-2 text-xs text-muted-foreground" role="status">{status === "ready" ? "Saved to your account" : "Saving…"}</p>}
    </header>
  );
}
