export type CategoryId =
  | "groceries"
  | "transport"
  | "entertainment"
  | "dining"
  | "bills"
  | "health"
  | "shopping"
  | "other";

export interface Expense {
  id: string;
  amount: number;
  category: CategoryId;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface WeeklyBudget {
  amount: number;
  effectiveFrom: string; // ISO date
  updatedAt: string;
}

export type TabId = "dashboard" | "expenses" | "analytics";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: string; // lucide icon name
  color: string;
  bgColor: string;
}
