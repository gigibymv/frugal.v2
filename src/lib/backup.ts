import { rejectedDraftArchive, currentBudgetRevision, currentBudgetOwner } from "@/lib/account-sync";
import { snapshotSchema } from "../../shared/snapshot";
import { emptyBudgetData, readBudgetData } from "@/lib/budget-data";

export function createLocalBackup() {
  return { format: "frugal-backup", version: 1, exportedAt: new Date().toISOString(), cloudRevision: currentBudgetRevision(), sourceAccountId: currentBudgetOwner(), ...readBudgetData() };
}

export function exportLocalBackup() {
  const raw = rejectedDraftArchive();
  const blob = new Blob([raw || JSON.stringify(createLocalBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frugal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  // Give the browser time to begin the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Legacy caches have no verified account owner. Export only on explicit request;
// never attach them to a newly created account automatically.
const legacyKeys = ["weekly-budget-budget", "weekly-budget-expenses", "weekly-budget-recurring", "frugal-oneoff-expenses", "frugal-settings"];
export function hasLegacyData() {
  try { return legacyKeys.some(key => localStorage.getItem(key) !== null); }
  catch { return false; }
}
export function exportLegacyBackup() {
  const stores = Object.fromEntries(legacyKeys.map(key => [key, localStorage.getItem(key)]));
  const blob = new Blob([JSON.stringify({ format: "frugal-legacy-browser-archive", version: 1, stores }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "frugal-previous-browser-data.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseBackup(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Choose a Frugal JSON backup.");
  const archive = value as Record<string, unknown>;
  if (archive.format === "frugal-backup" && archive.version === 1) {
    const { budgetHistory, expenses, recurringExpenses, oneOffExpenses, settings } = archive;
    return snapshotSchema.parse({ budgetHistory, expenses, recurringExpenses, oneOffExpenses, settings });
  }
  if (archive.format === "frugal-legacy-browser-archive" && archive.version === 1 && archive.stores && typeof archive.stores === "object") {
    const stores = archive.stores as Record<string, unknown>;
    const state = (key: string) => {
      const raw = stores[key];
      if (raw == null) return {};
      if (typeof raw !== "string") throw new Error("Invalid previous browser archive.");
      const decoded = JSON.parse(raw);
      if (!decoded || typeof decoded.state !== "object") throw new Error("Invalid previous browser archive.");
      return decoded.state;
    };
    const defaults = emptyBudgetData();
    const settings = state("frugal-settings");
    return snapshotSchema.parse({
      budgetHistory: state("weekly-budget-budget").budgetHistory ?? defaults.budgetHistory,
      expenses: state("weekly-budget-expenses").expenses ?? [],
      recurringExpenses: state("weekly-budget-recurring").recurringExpenses ?? [],
      oneOffExpenses: state("frugal-oneoff-expenses").oneOffExpenses ?? [],
      settings: { displayName: settings.displayName ?? "", weekStartDay: settings.weekStartDay ?? 1 },
    });
  }
  throw new Error("Choose a Frugal backup or previous browser archive.");
}


export function exportArchivedDraft(key: string, userId: string) {
  if (!key.startsWith(`frugal:account-draft:${userId}:`)) throw new Error("Invalid draft selection.");
  const raw = localStorage.getItem(key);
  if (!raw) throw new Error("That draft is no longer available in this browser.");
  let content = raw;
  try {
    const draft = JSON.parse(raw);
    const parsed = snapshotSchema.safeParse(draft.data);
    if (parsed.success) content = JSON.stringify({ format: "frugal-backup", version: 1, cloudRevision: draft.revision, sourceAccountId: userId, ...parsed.data }, null, 2);
  } catch { /* Preserve an invalid raw archive for manual recovery. */ }
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = "frugal-recovered-browser-draft.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
