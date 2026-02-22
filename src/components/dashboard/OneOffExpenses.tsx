import { Plus, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useOneOffExpenseStore } from "@/store/oneOffExpenseStore";
import { useSettingsStore } from "@/store/settingsStore";
import { ONEOFF_CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency, getWeekRange } from "@/lib/date-utils";
import { useMemo } from "react";

export function OneOffExpenses() {
  const selectedWeekOffset = useUIStore((s) => s.selectedWeekOffset);
  const toggleOneOffExpenseModal = useUIStore((s) => s.toggleOneOffExpenseModal);
  const setEditingOneOffExpense = useUIStore((s) => s.setEditingOneOffExpense);
  const deleteOneOffExpense = useOneOffExpenseStore((s) => s.deleteOneOffExpense);
  const allOneOff = useOneOffExpenseStore((s) => s.oneOffExpenses);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);

  const { start, end } = useMemo(
    () => getWeekRange(selectedWeekOffset, weekStartDay as 0|1|2|3|4|5|6),
    [selectedWeekOffset, weekStartDay]
  );

  const weekOneOff = useMemo(
    () => allOneOff.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    }).sort((a, b) => b.date.localeCompare(a.date)),
    [allOneOff, start, end]
  );

  const total = weekOneOff.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="retro-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">One-off Expenses</h3>
        <button
          onClick={() => toggleOneOffExpenseModal(true)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary"
          aria-label="Add one-off expense"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {weekOneOff.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          No one-off expenses this week
        </p>
      ) : (
        <>
          <div className="space-y-0">
            {weekOneOff.map((expense) => {
              const category = ONEOFF_CATEGORY_MAP[expense.category];
              const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon | undefined;

              return (
                <div key={expense.id} className="group flex items-center gap-3 py-2 border-b border-muted last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setEditingOneOffExpense(expense)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.bgColor }}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                      ) : (
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description || category.label}</p>
                      <p className="text-xs text-muted-foreground">{category.label}</p>
                    </div>
                    <span className="font-mono-nums text-sm font-bold shrink-0">
                      {formatCurrency(expense.amount)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteOneOffExpense(expense.id)}
                    className="opacity-40 hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-[#E74C3C] shrink-0"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-muted flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="font-mono-nums text-sm font-bold">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
