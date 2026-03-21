"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const variantIcon: Record<ToastVariant, React.ElementType> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const variantStyle: Record<ToastVariant, string> = {
  default: "border-subtle",
  success: "border-status-online/30",
  error: "border-status-danger/30",
};

const variantIconColor: Record<ToastVariant, string> = {
  default: "text-white/40",
  success: "text-status-online",
  error: "text-status-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = variantIcon[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-center gap-2 rounded border bg-surface-2 px-3 py-2.5",
                "shadow-xl shadow-black/30 animate-slide-up min-w-[200px] max-w-[360px]",
                variantStyle[t.variant]
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", variantIconColor[t.variant])} />
              <span className="flex-1 text-xs text-foreground">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded p-0.5 text-white/25 hover:text-white/60"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
