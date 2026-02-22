import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useExpenseStore } from "@/store/expenseStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { formatCurrency, getWeekRange } from "@/lib/date-utils";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="retro-card px-3 py-2 text-sm">
      <p className="font-medium">{label}</p>
      <p className="font-mono-nums font-semibold text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function WeekOverWeekChart() {
  const selectedWeekOffset = useUIStore((s) => s.selectedWeekOffset);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const { start, end } = useMemo(
    () => getWeekRange(selectedWeekOffset, weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6),
    [selectedWeekOffset, weekStartDay]
  );
  const getWeekOverWeekData = useExpenseStore((s) => s.getWeekOverWeekData);
  const data = getWeekOverWeekData(start, end, 4);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="retro-card p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">
        Week Over Week
      </h3>
      {!hasData ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No spending data yet
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="total"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
