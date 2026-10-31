import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { exportLocalBackup, parseBackup, exportArchivedDraft } from "@/lib/backup";
import { restoreBudgetData, archivedBrowserDrafts, currentBudgetRevision } from "@/lib/account-sync";
import { useAuthStore } from "@/store/authStore";
import type { BudgetSnapshot } from "../../../shared/snapshot";
import { useSettingsStore } from "@/store/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SettingsModal() {
  const show = useUIStore((s) => s.showSettingsModal);
  const toggle = useUIStore((s) => s.toggleSettingsModal);
  const displayName = useSettingsStore((s) => s.displayName);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const setWeekStartDay = useSettingsStore((s) => s.setWeekStartDay);

  const accountId = useAuthStore(s => s.user?.id);
  const archived = accountId ? archivedBrowserDrafts(accountId) : [];
  const accountEmail = useAuthStore(s => s.user?.email);
  const [restore, setRestore] = useState<{ filename: string; data: BudgetSnapshot; older: boolean } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [name, setName] = useState(displayName);
  const [startDay, setStartDay] = useState(weekStartDay);

  useEffect(() => {
    if (show) {
      setName(displayName);
      setStartDay(weekStartDay);
    }
  }, [show, displayName, weekStartDay]);

  function handleSave() {
    setDisplayName(name.trim());
    setWeekStartDay(startDay);
    toggle(false);
  }

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) toggle(false); }}>
      <DialogContent className="retro-card sm:max-w-[380px] p-0 gap-0 border-2 border-border max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Your budget is saved to your account. Sign in on another device
            to access it. You can also download a separate backup.
          </p>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm font-semibold text-foreground">
              Your Name
            </Label>
            <Input
              id="display-name"
              maxLength={100}
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
            />
          </div>

          {/* Week Start Day */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Week Starts On</Label>
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setStartDay(i)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${
                    startDay === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={exportLocalBackup}
            className="retro-btn w-full py-3 bg-card text-foreground font-semibold text-sm"
          >
            Download full backup (JSON)
          </button>

          {archived.length > 0 && <details className="text-sm space-y-2">
            <summary className="cursor-pointer font-semibold">Other browser drafts ({archived.length})</summary>
            <p>These copies may come from closed or other open tabs. Download one, then use Restore below to recover it into this account.</p>
            {archived.map((draft, index) => <button key={draft.key} type="button" className="block text-primary underline py-1" onClick={() => {
              try { exportArchivedDraft(draft.key, accountId!); }
              catch (error) { setRestoreError(error instanceof Error ? error.message : "Could not download that draft."); }
            }}>Download draft {index + 1}{draft.updatedAt ? ` (${new Date(draft.updatedAt).toLocaleString()})` : ""}</button>)}
          </details>}

          <div className="space-y-2">
            <Label htmlFor="restore-backup" className="text-sm font-semibold text-foreground">Restore a JSON backup</Label>
            <input id="restore-backup" type="file" accept="application/json,.json" className="block w-full text-sm text-foreground" onChange={async event => {
              const file = event.target.files?.[0];
              setRestore(null); setRestoreError(null);
              if (!file) return;
              try {
                if (file.size > 2_000_000) throw new Error("Choose a backup smaller than 2 MB.");
                const archive = JSON.parse(await file.text());
                const data = parseBackup(archive);
                const older = archive.sourceAccountId === accountId && Number.isSafeInteger(archive.cloudRevision) && archive.cloudRevision < currentBudgetRevision();
                setRestore({ filename: file.name, data, older });
              } catch { setRestoreError("This file is not a valid Frugal backup. No data was changed."); }
            }} />
            {restore && <div className="text-sm space-y-2">
              {restore.older && <p className="text-destructive">This backup is older than the saved account version. Restoring it may remove newer entries.</p>}
              <p>Restore {restore.filename} into {accountEmail}? This replaces the current budget and expenses.</p>
              <button type="button" className="retro-btn w-full py-2 bg-card text-foreground font-semibold" onClick={() => {
                try { restoreBudgetData(restore.data); setRestore(null); setRestoreError(null); toggle(false); }
                catch (error) { setRestoreError(error instanceof Error ? error.message : "Could not restore the backup."); }
              }}>Restore this backup</button>
            </div>}
            {restoreError && <p role="alert" className="text-sm text-destructive">{restoreError}</p>}
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            className="retro-btn w-full py-3 bg-primary text-primary-foreground font-semibold text-base"
          >
            Save Settings
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
