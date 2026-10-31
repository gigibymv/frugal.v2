import { useSyncStore, reloadSavedBudget, retryBudgetSync, startBudgetSync } from "@/lib/account-sync";
import { exportLocalBackup } from "@/lib/backup";
import { useAuthStore } from "@/store/authStore";

export function SyncNotice() {
  const { status, message } = useSyncStore();
  const refresh = useAuthStore(s => s.refresh);
  if (!message) return null;
  return (
    <div role="status" className="mx-auto max-w-md px-4 py-3 text-sm space-y-2">
      <p className="text-foreground">{message}</p>
      <div className="flex flex-wrap gap-3">
        {status === "session-changed" ? (
          <button className="text-primary font-semibold underline" onClick={() => { void refresh().then(verified => { const userId = useAuthStore.getState().user?.id; if (verified && userId) void startBudgetSync(userId); }); }}>Check session</button>
        ) : (status === "conflict" || status === "invalid") ? (
          <button className="text-primary font-semibold underline" onClick={reloadSavedBudget}>Load saved version</button>
        ) : (
          <button className="text-primary font-semibold underline" onClick={retryBudgetSync}>Retry</button>
        )}
        <button className="text-primary font-semibold underline" onClick={exportLocalBackup}>Download draft</button>
      </div>
    </div>
  );
}
