"use client";

import { ReactNode } from "react";
import { Zap } from "lucide-react";

export function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ping-purple">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-foreground">PING</span>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
