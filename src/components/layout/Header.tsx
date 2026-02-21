import { Settings } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function Header() {
  const toggleEditBudgetModal = useUIStore((s) => s.toggleEditBudgetModal);

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8F0] border-b-2 border-[#1A1A2E]">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E]">
          Frugal
        </h1>

        <button
          onClick={() => toggleEditBudgetModal(true)}
          className="p-2 rounded-lg hover:bg-[#F5EDE4] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-[#1A1A2E]" />
        </button>
      </div>
    </header>
  );
}
