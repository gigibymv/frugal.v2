import { Settings, LogOut, User } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const toggleEditBudgetModal = useUIStore((s) => s.toggleEditBudgetModal);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8F0] border-b-2 border-[#1A1A2E]">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E]">
          Frugal
        </h1>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#E0F5F1] mr-1">
            <User className="w-3.5 h-3.5 text-[#2D9E8F]" />
            <span className="text-xs font-medium text-[#2D9E8F] max-w-[100px] truncate">
              {user?.email?.split("@")[0]}
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-[#F5EDE4] transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 text-[#6B6B80]" />
          </button>
          <button
            onClick={() => toggleEditBudgetModal(true)}
            className="p-2 rounded-lg hover:bg-[#F5EDE4] transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-[#1A1A2E]" />
          </button>
        </div>
      </div>
    </header>
  );
}
