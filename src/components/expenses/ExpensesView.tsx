import { useWeekData } from "@/hooks/use-week-data";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/date-utils";
import { Plus } from "lucide-react";
import { ExpenseList } from "./ExpenseList";
import { AddExpenseModal } from "./AddExpenseModal";

export function ExpensesView() {
  const { spent, expenses } = useWeekData();
  const toggleModal = useUIStore((s) => s.toggleAddExpenseModal);

  return (
    <div className="space-y-4">
      {/* Header with total and add button */}
      <div className="retro-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider">
              Total Spent
            </p>
            <p className="font-mono-nums text-2xl font-bold text-[#1A1A2E] mt-0.5">
              {formatCurrency(spent)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleModal(true)}
            className="retro-btn flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold"
            style={{ backgroundColor: "#2D9E8F" }}
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Expense list */}
      <div className="retro-card p-5">
        <ExpenseList expenses={expenses} />
      </div>

      {/* Modal */}
      <AddExpenseModal />
    </div>
  );
}
