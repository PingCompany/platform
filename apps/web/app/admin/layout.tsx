import { DashboardShell } from "@/components/layout/DashboardShell";
import { ToastProvider } from "@/components/ui/toast-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
