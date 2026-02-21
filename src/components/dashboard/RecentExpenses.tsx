import * as Icons from "lucide-react";
import { useWeekData } from "@/hooks/use-week-data";
import { useUIStore } from "@/store/uiStore";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency } from "@/lib/date-utils";
import type { LucideIcon } from "lucide-react";

export function RecentExpenses() {
  const { expenses } = useWeekData();
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="retro-card p-4">
      <h3 className="font-bold text-sm mb-3">Recent Expenses</h3>

      {recentExpenses.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">
          No expenses this week
        </p>
      ) : (
        <div className="space-y-2">
          {recentExpenses.map((expense) => {
            const category = CATEGORY_MAP[expense.category];
            const IconComponent = Icons[
              category.icon as keyof typeof Icons
            ] as LucideIcon | undefined;

            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 py-2 border-b border-muted last:border-b-0"
              >
                {/* Category icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: category.bgColor }}
                >
                  {IconComponent ? (
                    <IconComponent
                      className="w-4 h-4"
                      style={{ color: category.color }}
                    />
                  ) : (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {expense.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.label}
                  </p>
                </div>

                {/* Amount */}
                <span className="font-mono-nums text-sm font-bold shrink-0">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {expenses.length > 5 && (
        <button
          onClick={() => setActiveTab("expenses")}
          className="w-full text-center text-sm font-semibold text-primary mt-3 hover:underline"
        >
          View All ({expenses.length})
        </button>
      )}
    </div>
  );
}
