import { LogOut, User } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

export function Header() {
  const toggleSettingsModal = useUIStore((s) => s.toggleSettingsModal);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
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
              {displayName || user?.email?.split("@")[0]}
            </span>
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
