"use client";

import { useState } from "react";
import type React from "react";
import { Search, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface DelegatePickerProps {
  onSelect: (userId: string) => void;
  trigger: React.ReactNode;
  members: Member[];
}

export function DelegatePicker({
  onSelect,
  trigger,
  members,
}: DelegatePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No members found
            </p>
          )}
          {filtered.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                onSelect(member.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-white/5"
            >
              <Avatar className="h-6 w-6">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>{member.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
