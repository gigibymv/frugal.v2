import { useWeekData } from "@/hooks/use-week-data";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/date-utils";

export function BudgetCard() {
  const { budget, spent, remaining, percentUsed } = useWeekData();
  const toggleEditBudgetModal = useUIStore((s) => s.toggleEditBudgetModal);
  const isOverBudget = remaining < 0;

  return (
    <div className="retro-card-teal p-5">
      <p className="text-sm font-medium text-white/80 mb-1">Weekly Budget</p>

      <button
        onClick={() => toggleEditBudgetModal(true)}
        className="block w-full text-left group"
        aria-label="Edit budget"
      >
        <p className="font-mono-nums text-4xl font-bold text-white group-hover:text-white/90 transition-colors">
          {formatCurrency(budget)}
        </p>
      </button>

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

      {/* Spent / Remaining */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-white/90">
          Spent{" "}
          <span className="font-mono-nums font-bold text-white">
            {formatCurrency(spent)}
          </span>
        </span>
        <span className="font-medium text-white/90">
          Remaining{" "}
          <span
            className={`font-mono-nums font-bold ${
              isOverBudget ? "text-pink-200" : "text-white"
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </span>
      </div>
    </div>
  );
}
