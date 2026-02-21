import { useWeekData } from "@/hooks/use-week-data";
import { SpendingSummary } from "./SpendingSummary";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { WeekOverWeekChart } from "./WeekOverWeekChart";

export function AnalyticsView() {
  const { expenses } = useWeekData();

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="retro-card p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-muted-foreground text-sm">
            Add some expenses to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SpendingSummary />
      <CategoryBreakdown />
      <WeekOverWeekChart />
    </div>
  );
}
