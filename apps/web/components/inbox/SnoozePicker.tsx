"use client";

import type React from "react";
import { Clock, Sun, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SnoozePickerProps {
  onSnooze: (timestamp: number) => void;
  trigger: React.ReactNode;
}

function getNextMorning(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

function getNextMondayMorning(): number {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

const options = [
  {
    label: "1 hour",
    icon: Clock,
    getTimestamp: () => Date.now() + 60 * 60 * 1000,
  },
  {
    label: "4 hours",
    icon: Clock,
    getTimestamp: () => Date.now() + 4 * 60 * 60 * 1000,
  },
  {
    label: "Tomorrow morning",
    icon: Sun,
    getTimestamp: getNextMorning,
  },
  {
    label: "Next week",
    icon: Calendar,
    getTimestamp: getNextMondayMorning,
  },
] as const;

export function SnoozePicker({ onSnooze, trigger }: SnoozePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={() => onSnooze(option.getTimestamp())}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
