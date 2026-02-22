import { LayoutDashboard, Receipt, BarChart3 } from "lucide-react";
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t-2 border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto max-w-md flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
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
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-semibold">{tab.label}</span>
    </button>
  );
}
