import { useWeekData } from "@/hooks/use-week-data";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/date-utils";

export function BudgetCard() {
  const { budget, spent, remaining, percentUsed } = useWeekData();
  const toggleEditBudgetModal = useUIStore((s) => s.toggleEditBudgetModal);
  const isOverBudget = remaining < 0;

  return (
    <div className="retro-card-teal p-5">
      <p className="text-sm font-medium text-white/80 mb-1">Remaining</p>

      <p
        className={`font-mono-nums text-4xl font-bold ${
          isOverBudget ? "text-pink-200" : "text-white"
        }`}
      >
        {formatCurrency(remaining)}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-white/80">
          Weekly Budget: {formatCurrency(budget)}
        </span>
        <button
          onClick={() => toggleEditBudgetModal(true)}
          className="retro-btn text-xs px-2 py-0.5"
        >
          Adjust
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 mb-3">
        <div className="w-full h-3 bg-white/20 rounded-full border border-white/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentUsed, 100)}%`,
              backgroundColor: isOverBudget ? "#E91E63" : "#F4D35E",
            }}
          />
        </div>
      </div>

      {/* Spent */}
      <p className="text-sm text-white/90">
        Spent {formatCurrency(spent)}
      </p>
    </div>
  );
}
