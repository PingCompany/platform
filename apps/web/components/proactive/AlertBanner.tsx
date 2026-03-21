"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertAction {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

interface AlertBannerProps {
  title: string;
  description: string;
  actions?: AlertAction[];
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export function AlertBanner({
  title,
  description,
  actions = [],
  onDismiss,
  autoDismissMs = 10000,
  className,
}: AlertBannerProps) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoDismissMs) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - 100 / (autoDismissMs / 100);
        if (next <= 0) {
          clearInterval(interval);
          onDismiss?.();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      className={cn(
        "absolute bottom-20 right-4 z-50 w-80 overflow-hidden rounded-md border shadow-2xl",
        "border-l-4 border-l-status-danger border-status-danger/20 bg-surface-2",
        "transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Progress bar */}
      <div
        className="h-0.5 bg-status-danger transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-status-danger" />
            <span className="text-xs font-semibold text-foreground">{title}</span>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 rounded p-0.5 text-white/30 hover:bg-surface-3 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Description */}
        <p className="mt-1.5 pl-5 text-xs text-muted-foreground">{description}</p>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-2 flex gap-1.5 pl-5">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick ?? onDismiss}
                className={cn(
                  "rounded px-2 py-1 text-2xs font-medium transition-colors",
                  action.primary
                    ? "bg-ping-purple text-white hover:bg-ping-purple-hover"
                    : "bg-surface-3 text-foreground hover:bg-white/10"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
