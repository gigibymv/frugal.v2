import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBudgetStore } from "@/store/budgetStore";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/date-utils";

const PRESET_AMOUNTS = [200, 300, 500, 750, 1000];

const PRESET_COLORS = [
  { bg: "bg-[#E0F5F1]", border: "border-[#2D9E8F]", text: "text-[#2D9E8F]" },
  { bg: "bg-[#E0EAFF]", border: "border-[#5B8DEF]", text: "text-[#5B8DEF]" },
  { bg: "bg-[#FFF8E0]", border: "border-[#F4D35E]", text: "text-foreground" },
  { bg: "bg-[#FFE0F0]", border: "border-[#E91E8C]", text: "text-[#E91E8C]" },
  { bg: "bg-[#FFF0E0]", border: "border-[#FF8C42]", text: "text-[#FF8C42]" },
];

export function EditBudgetModal() {
  const { getCurrentBudget, setBudget } = useBudgetStore();
  const { showEditBudgetModal, toggleEditBudgetModal } = useUIStore();

  const currentBudget = getCurrentBudget();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (showEditBudgetModal) {
      setAmount(String(currentBudget));
      setError("");
    }
  }, [showEditBudgetModal, currentBudget]);

  function handleAmountChange(value: string) {
    // Allow only digits and a single decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    const sanitized =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
    setAmount(sanitized);
    setError("");
  }

  function handlePreset(preset: number) {
    setAmount(String(preset));
    setError("");
  }

  function handleSave() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Budget must be greater than $0");
      return;
    }
    setBudget(parsed);
    toggleEditBudgetModal(false);
  }

  return (
    <Dialog
      open={showEditBudgetModal}
      onOpenChange={(open) => toggleEditBudgetModal(open)}
    >
      <DialogContent
        className="retro-card bg-card border-2 border-foreground p-0 gap-0 sm:max-w-md"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-center">
            Set Weekly Budget
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Current budget:{" "}
            <span className="font-mono-nums font-bold text-foreground">
              {formatCurrency(currentBudget)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Amount input */}
          <div className="flex flex-col items-center gap-2">
            <label
              htmlFor="budget-amount"
              className="text-sm font-medium text-muted-foreground"
            >
              New weekly budget
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-3xl font-mono-nums font-bold text-muted-foreground select-none">
                $
              </span>
              <input
                id="budget-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                className="w-full max-w-[280px] text-center text-4xl font-mono-nums font-bold bg-background border-2 border-foreground rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 placeholder:text-muted-foreground/40"
                placeholder="0"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
          </div>

          {/* Preset buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">
              Quick presets
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_AMOUNTS.map((preset, i) => {
                const colors = PRESET_COLORS[i];
                const isActive = amount === String(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={`retro-btn px-4 py-1.5 text-sm font-mono-nums font-bold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-foreground"
                        : `${colors.bg} ${colors.text} ${colors.border}`
                    }`}
                  >
                    ${preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            className="retro-btn w-full bg-primary text-primary-foreground text-lg font-bold py-3 hover:brightness-110 transition-colors"
          >
            Save Budget
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
