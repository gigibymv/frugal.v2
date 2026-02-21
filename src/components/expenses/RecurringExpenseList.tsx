import { useState } from "react";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency } from "@/lib/date-utils";
import { Repeat, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from "lucide-react";
import type { RecurringExpense } from "@/types";
import { RecurringExpenseForm } from "./RecurringExpenseForm";

const FREQ_LABELS: Record<RecurringExpense["frequency"], string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

export function RecurringExpenseList() {
  const recurringExpenses = useRecurringExpenseStore((s) => s.recurringExpenses);
  const toggleActive = useRecurringExpenseStore((s) => s.toggleActive);
  const deleteRecurring = useRecurringExpenseStore((s) => s.deleteRecurring);

  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);

  function handleEdit(r: RecurringExpense) {
    setEditing(r);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <>
      <div className="retro-card p-5">
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-[#9B59B6]" />
            <span className="text-sm font-bold text-[#1A1A2E]">
              Recurring Expenses
            </span>
            {recurringExpenses.length > 0 && (
              <span className="text-xs font-semibold text-[#6B6B80] bg-[#F0F0F4] rounded-full px-2 py-0.5">
                {recurringExpenses.length}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp size={18} className="text-[#6B6B80]" />
          ) : (
            <ChevronDown size={18} className="text-[#6B6B80]" />
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {/* Add button */}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="retro-btn flex items-center gap-2 px-3 py-2 text-white text-xs font-semibold"
              style={{ backgroundColor: "#9B59B6" }}
            >
              <Plus size={14} />
              Add Recurring
            </button>

            {recurringExpenses.length === 0 ? (
              <p className="text-[#6B6B80] text-sm py-4 text-center">
                No recurring expenses yet
              </p>
            ) : (
              <div className="divide-y divide-[#1A1A2E]/10">
                {recurringExpenses.map((r) => {
                  const cat = CATEGORY_MAP[r.category];
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-3">
                      {/* Category icon */}
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                        style={{ backgroundColor: cat.bgColor }}
                      >
                        <Repeat size={16} style={{ color: cat.color }} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1A1A2E] truncate">
                            {r.description || cat.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F0E4F7] text-[#9B59B6] shrink-0">
                            {FREQ_LABELS[r.frequency]}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B6B80]">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Active toggle */}
                        <button
                          type="button"
                          onClick={() => toggleActive(r.id)}
                          className={`relative w-10 h-6 rounded-full transition-colors ${
                            r.active ? "bg-[#2D9E8F]" : "bg-[#D1D1D6]"
                          }`}
                          title={r.active ? "Active" : "Paused"}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              r.active ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-[#F0F0F4] transition-colors"
                        >
                          <Pencil size={14} className="text-[#6B6B80]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRecurring(r.id)}
                          className="p-1.5 rounded-lg hover:bg-[#FDECEC] transition-colors"
                        >
                          <Trash2 size={14} className="text-[#E74C3C]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <RecurringExpenseForm open={showForm} onClose={handleCloseForm} editing={editing} />
    </>
  );
}
