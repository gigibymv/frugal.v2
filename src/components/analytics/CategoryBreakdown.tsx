import { useMemo } from "react";
import { useWeekData } from "@/hooks/use-week-data";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency } from "@/lib/date-utils";
import type { CategoryId } from "@/types";

export function CategoryBreakdown() {
  const { spentByCategory } = useWeekData();

  const sortedCategories = useMemo(() => {
    return (Object.entries(spentByCategory) as [CategoryId, number][])
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a);
  }, [spentByCategory]);

  const maxAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  if (sortedCategories.length === 0) {
    return (
      <div className="retro-card p-5">
        <h3 className="text-lg font-bold text-foreground mb-4">
          Category Breakdown
        </h3>
        <p className="text-muted-foreground text-sm text-center py-4">
          No spending data yet
        </p>
      </div>
    );
  }

  return (
    <div className="retro-card p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">
        Category Breakdown
      </h3>
      <div className="space-y-3">
        {sortedCategories.map(([categoryId, amount]) => {
          const category = CATEGORY_MAP[categoryId];
          const widthPercent =
            maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

          return (
            <div key={categoryId} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 shrink-0">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: category.bgColor }}
                >
                  {category.icon === "ShoppingCart" && "🛒"}
                  {category.icon === "Car" && "🚗"}
                  {category.icon === "Gamepad2" && "🎮"}
                  {category.icon === "UtensilsCrossed" && "🍽"}
                  {category.icon === "Receipt" && "🧾"}
                  {category.icon === "Heart" && "❤️"}
                  {category.icon === "ShoppingBag" && "🛍"}
                  {category.icon === "MoreHorizontal" && "•••"}
                </span>
                <span className="text-sm font-medium truncate">
                  {category.label}
                </span>
              </div>
              <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden border border-foreground/10">
                <div
                  className="h-full rounded-md transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: category.color,
                    minWidth: widthPercent > 0 ? "4px" : "0px",
                  }}
                />
              </div>
              <span className="font-mono-nums text-sm font-semibold w-20 text-right">
                {formatCurrency(amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
