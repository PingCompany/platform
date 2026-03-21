"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  labels,
}: OnboardingProgressProps) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                i < currentStep
                  ? "bg-ping-purple text-white"
                  : i === currentStep
                    ? "border-2 border-ping-purple bg-ping-purple/15 text-ping-purple"
                    : "border border-subtle bg-surface-1 text-muted-foreground",
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors",
                  i < currentStep ? "bg-ping-purple" : "bg-white/10",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[currentStep]}</p>
    </div>
  );
}
