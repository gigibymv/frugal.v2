import { LayoutDashboard, Receipt, BarChart3, Plus } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import type { TabId } from "@/types";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function TabBar() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const toggleAddExpenseModal = useUIStore((s) => s.toggleAddExpenseModal);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-[#1A1A2E]">
      <div className="mx-auto max-w-md flex items-center justify-around px-2 py-2">
        {/* First tab */}
        <TabButton
          tab={tabs[0]}
          isActive={activeTab === tabs[0].id}
          onClick={() => setActiveTab(tabs[0].id)}
        />

        {/* Second tab */}
        <TabButton
          tab={tabs[1]}
          isActive={activeTab === tabs[1].id}
          onClick={() => setActiveTab(tabs[1].id)}
        />

        {/* Center plus button */}
        <button
          onClick={() => toggleAddExpenseModal(true)}
          className="retro-btn flex items-center justify-center w-12 h-12 bg-[#2D9E8F] text-white -mt-5"
          aria-label="Add expense"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Third tab */}
        <TabButton
          tab={tabs[2]}
          isActive={activeTab === tabs[2].id}
          onClick={() => setActiveTab(tabs[2].id)}
        />

        {/* Spacer to balance the layout — hidden placeholder */}
        <div className="w-12" />
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: (typeof tabs)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
        isActive
          ? "text-[#2D9E8F]"
          : "text-[#6B6B80] hover:text-[#1A1A2E]"
      }`}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-semibold">{tab.label}</span>
    </button>
  );
}
