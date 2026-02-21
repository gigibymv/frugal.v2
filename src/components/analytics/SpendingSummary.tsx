import { useMemo } from "react";
import { useWeekData } from "@/hooks/use-week-data";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency } from "@/lib/date-utils";
import type { CategoryId } from "@/types";

export function SpendingSummary() {
  const { spent, expenses, spentByCategory } = useWeekData();

  const stats = useMemo(() => {
    const avgDaily = spent / 7;
    const transactionCount = expenses.length;

    let biggestCategoryId: CategoryId | null = null;
    let biggestAmount = 0;
    for (const [catId, amount] of Object.entries(spentByCategory) as [
      CategoryId,
      number,
    ][]) {
      if (amount > biggestAmount) {
        biggestAmount = amount;
        biggestCategoryId = catId;
      }
    }

    const biggestCategoryLabel = biggestCategoryId
      ? CATEGORY_MAP[biggestCategoryId].label
      : "—";

    return { avgDaily, biggestCategoryLabel, biggestAmount, transactionCount };
  }, [spent, expenses, spentByCategory]);

  return (
    <div className="retro-card p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">
        Spending Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Average Daily */}
        <div className="border-2 border-foreground/15 rounded-lg p-3 bg-muted/40">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Avg / Day
          </p>
          <p className="font-mono-nums text-xl font-bold text-foreground">
            {formatCurrency(stats.avgDaily)}
          </p>
        </div>

        {/* Biggest Category */}
        <div className="border-2 border-foreground/15 rounded-lg p-3 bg-muted/40">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Top Category
          </p>
          <p className="font-semibold text-foreground truncate">
            {stats.biggestCategoryLabel}
          </p>
          {stats.biggestAmount > 0 && (
            <p className="font-mono-nums text-sm text-muted-foreground">
              {formatCurrency(stats.biggestAmount)}
            </p>
          )}
        </div>

        {/* Transaction Count */}
        <div className="border-2 border-foreground/15 rounded-lg p-3 bg-muted/40">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Transactions
          </p>
          <p className="font-mono-nums text-xl font-bold text-foreground">
            {stats.transactionCount}
          </p>
        </div>
      </div>
    </div>
  );
}
