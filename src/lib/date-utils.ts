import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, parseISO } from "date-fns";

export function getWeekRange(offset: number = 0, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1) {
  const now = new Date();
  const target = addWeeks(now, offset);
  const start = startOfWeek(target, { weekStartsOn });
  const end = endOfWeek(target, { weekStartsOn });
  return { start, end };
}

export function formatWeekLabel(offset: number, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): string {
  if (offset === 0) return "This Week";
  if (offset === -1) return "Last Week";
  if (offset === 1) return "Next Week";
  const { start, end } = getWeekRange(offset, weekStartsOn);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), "EEE, MMM d");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const date = parseISO(dateStr);
  return isWithinInterval(date, { start, end });
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
