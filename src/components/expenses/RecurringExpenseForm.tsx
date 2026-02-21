import { useEffect, useState } from "react";
import type { CategoryId, RecurringExpense } from "@/types";
import { todayISO } from "@/lib/date-utils";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "./CategoryPicker";

interface RecurringExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editing: RecurringExpense | null;
}

const FREQUENCIES = [
  { value: "weekly" as const, label: "Weekly" },
  { value: "biweekly" as const, label: "Biweekly" },
  { value: "monthly" as const, label: "Monthly" },
];

export function RecurringExpenseForm({ open, onClose, editing }: RecurringExpenseFormProps) {
  const addRecurring = useRecurringExpenseStore((s) => s.addRecurring);
  const editRecurring = useRecurringExpenseStore((s) => s.editRecurring);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurringExpense["frequency"]>("monthly");
  const [startDate, setStartDate] = useState(todayISO());

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDescription(editing.description);
      setFrequency(editing.frequency);
      setStartDate(editing.startDate);
    }
  }, [editing]);

  function resetForm() {
    setAmount("");
    setCategory(null);
    setDescription("");
    setFrequency("monthly");
    setStartDate(todayISO());
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category) return;

    if (editing) {
      editRecurring(editing.id, {
        amount: parsedAmount,
        category,
        description,
        frequency,
        startDate,
      });
    } else {
      addRecurring({
        amount: parsedAmount,
        category,
        description,
        frequency,
        startDate,
        active: true,
      });
    }

    handleClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="retro-card sm:max-w-[420px] p-0 gap-0 border-2 border-[#1A1A2E]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-[#1A1A2E]">
            {editing ? "Edit Recurring Expense" : "Add Recurring Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="rec-amount" className="text-sm font-semibold text-[#1A1A2E]">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-nums text-[#6B6B80]">
                $
              </span>
              <Input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-3xl font-mono-nums h-16 border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1A1A2E]">Category</Label>
            <CategoryPicker selected={category} onSelect={setCategory} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="rec-description" className="text-sm font-semibold text-[#1A1A2E]">
              Description
            </Label>
            <Input
              id="rec-description"
              type="text"
              placeholder="e.g. Netflix subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1A1A2E]">Frequency</Label>
            <div className="flex gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                    frequency === f.value
                      ? "border-[#1A1A2E] bg-[#1A1A2E] text-white shadow-[2px_2px_0px_#1A1A2E]"
                      : "border-[#1A1A2E]/20 text-[#1A1A2E] hover:border-[#1A1A2E]/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="rec-start-date" className="text-sm font-semibold text-[#1A1A2E]">
              Start Date
            </Label>
            <Input
              id="rec-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!amount || !category}
            className="retro-btn w-full py-3 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#2D9E8F" }}
          >
            {editing ? "Save Changes" : "Add Recurring Expense"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
