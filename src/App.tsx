import { lazy, Suspense, useEffect } from "react";
import { Plus } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useSyncStore, startBudgetSync, stopBudgetSync, refreshBudgetSync, saveBudgetData } from "@/lib/account-sync";
import { AuthPage } from "@/components/auth/AuthPage";
import { SyncNotice } from "@/components/auth/SyncNotice";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { WeekNavigator } from "@/components/dashboard/WeekNavigator";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { OneOffExpenseFormModal } from "@/components/expenses/OneOffExpenseFormModal";
import { EditBudgetModal } from "@/components/budget/EditBudgetModal";
import { SettingsModal } from "@/components/settings/SettingsModal";

const DashboardView = lazy(() => import("@/components/dashboard/DashboardView"));
const ExpensesView = lazy(() => import("@/components/expenses/ExpensesView"));
const AnalyticsView = lazy(() => import("@/components/analytics/AnalyticsView"));

const ViewSpinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ActiveView() {
  const activeTab = useUIStore((s) => s.activeTab);

  return (
    <Suspense fallback={<ViewSpinner />}>
      {activeTab === "expenses" ? (
        <ExpensesView />
      ) : activeTab === "analytics" ? (
        <AnalyticsView />
      ) : (
        <DashboardView />
      )}
    </Suspense>
  );
}

export default function App() {
  const user = useAuthStore(s => s.user);
  const userId = user?.id;
  const authLoading = useAuthStore(s => s.loading);
  const ready = useSyncStore(s => s.ready);
  const syncStatus = useSyncStore(s => s.status);

  useEffect(() => {
    void useAuthStore.getState().initialize();
    const refresh = () => {
      if (document.visibilityState !== "visible") { void saveBudgetData(true); return; }
      if (useAuthStore.getState().busy) return;
      void useAuthStore.getState().refresh().then(verified => { if (verified) void refreshBudgetSync(); });
    };
    const accountChanged = (event: StorageEvent) => {
      if (event.key !== "frugal:auth-event") return;
      void useAuthStore.getState().refresh().then(verified => { if (verified) void refreshBudgetSync(); });
    };
    const saveOnExit = () => { void saveBudgetData(true); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pagehide", saveOnExit);
    window.addEventListener("online", refresh);
    window.addEventListener("storage", accountChanged);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pagehide", saveOnExit);
      window.removeEventListener("online", refresh);
      window.removeEventListener("storage", accountChanged);
    };
  }, []);

  useEffect(() => {
    if (userId && !authLoading) void startBudgetSync(userId);
    return stopBudgetSync;
  }, [userId, authLoading]);
  // Apply dark mode class to document
  useEffect(() => {
    const applyDark = (dark: boolean) => {
      document.documentElement.classList.toggle("dark", dark);
    };
    applyDark(useUIStore.getState().darkMode);
    const unsub = useUIStore.subscribe(
      (state) => state.darkMode,
      (dark) => applyDark(dark),
    );
    return unsub;
  }, []);

  if (authLoading) return <div className="min-h-dvh bg-background flex items-center justify-center"><ViewSpinner /></div>;
  if (!user) return <AuthPage />;
  if (!ready || syncStatus === "session-changed") {
    return <><Header /><SyncNotice />{syncStatus === "loading" && <ViewSpinner />}</>;
  }

  return (
    <>
      <Header />
      <SyncNotice />
      <AppShell>
        <WeekNavigator />
        <ActiveView />
      </AppShell>
      <TabBar />

      {/* Floating Action Button */}
      <button
        onClick={() => useUIStore.getState().toggleAddExpenseModal(true)}
        className="retro-btn fixed z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground"
        style={{
          bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
          right: "max(1.25rem, calc((100vw - 28rem) / 2 + 1.25rem))",
        }}
        aria-label="Add expense"
      >
        <Plus className="w-6 h-6" />
      </button>

      <ExpenseFormModal />
      <OneOffExpenseFormModal />
      <EditBudgetModal />
      <SettingsModal />
    </>
  );
}
