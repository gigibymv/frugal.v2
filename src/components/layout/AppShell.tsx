import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="mx-auto w-full max-w-md flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
