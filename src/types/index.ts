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

export interface RecurringExpense {
  id: string;
  amount: number;
  category: CategoryId;
  description: string;
  frequency: "weekly" | "biweekly" | "monthly";
  startDate: string; // ISO date
  lastGenerated: string | null; // ISO date of last generated expense
  active: boolean;
  createdAt: string;
}

export type TabId = "dashboard" | "expenses" | "analytics";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: string; // lucide icon name
  color: string;
  bgColor: string;
}

export type OneOffCategoryId = "gifts" | "shopping" | "entertainment" | "travel" | "other";

export interface OneOffExpense {
  id: string;
  amount: number;
  category: OneOffCategoryId;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}
