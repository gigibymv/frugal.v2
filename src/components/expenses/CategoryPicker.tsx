import type { CategoryId } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import {
  ShoppingCart,
  Car,
  Gamepad2,
  UtensilsCrossed,
  Receipt,
  Heart,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Car,
  Gamepad2,
  UtensilsCrossed,
  Receipt,
  Heart,
  ShoppingBag,
  MoreHorizontal,
};

interface CategoryPickerProps {
  selected: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => {
        const Icon = ICON_MAP[cat.icon];
        const isSelected = selected === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all ${
              isSelected
                ? "border-3 border-[#1A1A2E] scale-105 bg-white shadow-[2px_2px_0px_#1A1A2E]"
                : "border-2 border-transparent hover:border-[#1A1A2E]/20"
            }`}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ backgroundColor: cat.bgColor }}
            >
              {Icon && <Icon size={20} style={{ color: cat.color }} />}
            </div>
            <span className="text-xs font-medium text-[#1A1A2E] leading-tight">
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
