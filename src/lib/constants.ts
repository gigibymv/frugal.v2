import type { CategoryConfig, CategoryId, OneOffCategoryId } from "@/types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "groceries", label: "Groceries", icon: "ShoppingCart", color: "#2D9E8F", bgColor: "#E0F5F1" },
  { id: "transport", label: "Transport", icon: "Car", color: "#5B8DEF", bgColor: "#E0EAFF" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "#9B59B6", bgColor: "#F0E4F7" },
  { id: "dining", label: "Dining", icon: "UtensilsCrossed", color: "#FF8C42", bgColor: "#FFF0E0" },
  { id: "bills", label: "Bills", icon: "Receipt", color: "#E91E8C", bgColor: "#FFE0F0" },
  { id: "health", label: "Health", icon: "Heart", color: "#E74C3C", bgColor: "#FDECEC" },
  { id: "shopping", label: "Shopping", icon: "ShoppingBag", color: "#F4D35E", bgColor: "#FFF8E0" },
  { id: "other", label: "Other", icon: "MoreHorizontal", color: "#6B6B80", bgColor: "#F0F0F4" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryConfig>;

export const DEFAULT_BUDGET = 500;

export interface OneOffCategoryConfig {
  id: OneOffCategoryId;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const ONEOFF_CATEGORIES: OneOffCategoryConfig[] = [
  { id: "gifts", label: "Gifts", icon: "Gift", color: "#E91E8C", bgColor: "#FFE0F0" },
  { id: "shopping", label: "Shopping", icon: "ShoppingBag", color: "#F4D35E", bgColor: "#FFF8E0" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "#9B59B6", bgColor: "#F0E4F7" },
  { id: "travel", label: "Travel", icon: "Plane", color: "#5B8DEF", bgColor: "#E0EAFF" },
  { id: "other", label: "Other", icon: "MoreHorizontal", color: "#6B6B80", bgColor: "#F0F0F4" },
];

export const ONEOFF_CATEGORY_MAP = Object.fromEntries(
  ONEOFF_CATEGORIES.map((c) => [c.id, c])
) as Record<OneOffCategoryId, OneOffCategoryConfig>;

export const CHART_COLORS = [
  "#2D9E8F",
  "#E91E8C",
  "#F4D35E",
  "#FF8C42",
  "#5B8DEF",
  "#9B59B6",
  "#E74C3C",
  "#6B6B80",
];
