"use client";

// Shared types and config for the unified inbox

export type InboxCategory = "do" | "decide" | "delegate" | "skip";
export type PriorityLevel = "urgent" | "high" | "medium" | "low";

// Keep EisenhowerQuadrant as an alias for backwards compat in other components
export type EisenhowerQuadrant = "urgent-important" | "important" | "urgent" | "fyi";

export const CATEGORY_ORDER: InboxCategory[] = ["do", "decide", "delegate", "skip"];

export const CATEGORY_TO_PRIORITY: Record<InboxCategory, PriorityLevel> = {
  do: "urgent",
  decide: "high",
  delegate: "medium",
  skip: "low",
};

export const priorityConfig: Record<
  InboxCategory,
  { borderColor: string; borderWidth: string; bg: string; label: string; textColor: string; dimmed: boolean; bold: boolean; pulse: boolean }
> = {
  do:       { borderColor: "bg-priority-urgent",    borderWidth: "w-[3px]", bg: "bg-priority-urgent/8",    label: "DO",       textColor: "text-priority-urgent",    dimmed: false, bold: true,  pulse: true  },
  decide:   { borderColor: "bg-priority-important", borderWidth: "w-0.5",   bg: "bg-priority-important/8", label: "DECIDE",   textColor: "text-priority-important", dimmed: false, bold: false, pulse: false },
  delegate: { borderColor: "bg-blue-500",           borderWidth: "w-0.5",   bg: "bg-blue-500/8",           label: "DELEGATE", textColor: "text-blue-400",           dimmed: false, bold: false, pulse: false },
  skip:     { borderColor: "bg-foreground/20",      borderWidth: "w-0.5",   bg: "bg-foreground/5",         label: "SKIP",     textColor: "text-foreground/30",      dimmed: true,  bold: false, pulse: false },
};

// Re-export QUADRANT_ORDER for backwards compat
export const QUADRANT_ORDER: EisenhowerQuadrant[] = ["urgent-important", "important", "urgent", "fyi"];
