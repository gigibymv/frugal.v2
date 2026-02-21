import { Settings, LogOut, User, Moon, Sun } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const toggleEditBudgetModal = useUIStore((s) => s.toggleEditBudgetModal);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-30 bg-background border-b-2 border-border">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Frugal
        </h1>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 mr-1">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary max-w-[100px] truncate">
              {user?.email?.split("@")[0]}
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => toggleEditBudgetModal(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
