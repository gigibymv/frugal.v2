import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, parseISO } from "date-fns";

export function getWeekRange(offset: number = 0) {
  const now = new Date();
  const target = addWeeks(now, offset);
  const start = startOfWeek(target, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(target, { weekStartsOn: 1 }); // Sunday
  return { start, end };
}

export function formatWeekLabel(offset: number): string {
  if (offset === 0) return "This Week";
  if (offset === -1) return "Last Week";
  if (offset === 1) return "Next Week";
  const { start, end } = getWeekRange(offset);
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
