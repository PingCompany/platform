"use client";

import { useState, useEffect } from "react";
import { Settings, Power, Bot } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  scopes: string[];
  queryCount: number;
  color: string;
}

interface AgentCardProps {
  agent: Agent;
  onToggle?: (id: string, status: "active" | "inactive") => void;
  onConfigure?: (id: string) => void;
}

export function AgentCard({ agent, onToggle, onConfigure }: AgentCardProps) {
  const isActive = agent.status === "active";

  return (
    <div
      className={cn(
        "group flex flex-col rounded border border-subtle bg-surface-1 p-4",
        "transition-all duration-150 hover:border-white/10 hover:bg-surface-2"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}30` }}
          >
            <Bot className="h-4 w-4" style={{ color: agent.color }} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{agent.name}</p>
            <div className="flex items-center gap-1.5">
              <StatusDot variant={isActive ? "online" : "offline"} size="xs" />
              <span className="text-2xs text-muted-foreground">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {agent.description}
      </p>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.scopes.map((scope) => (
          <span
            key={scope}
            className="rounded border border-subtle bg-surface-3 px-1.5 py-px text-2xs text-white/50"
          >
            #{scope}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3">
        <span className="text-2xs text-muted-foreground">
          {agent.queryCount.toLocaleString()} queries today
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-2xs text-muted-foreground hover:text-foreground"
            onClick={() => onToggle?.(agent.id, isActive ? "inactive" : "active")}
          >
            <Power className="h-2.5 w-2.5" />
            {isActive ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 border-subtle px-2 text-2xs hover:border-white/15"
            onClick={() => onConfigure?.(agent.id)}
          >
            <Settings className="h-2.5 w-2.5" />
            Configure
          </Button>
        </div>
      </div>
    </div>
  );
}

const ALL_CHANNELS = ["general", "engineering", "design", "product", "private-salary", "exec"];
const AGENT_COLORS = ["#5E6AD2", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#3B82F6"];

interface AgentConfigDialogProps {
  agent: Agent | null;
  mode: "edit" | "create";
  open: boolean;
  onClose: () => void;
  onSave?: (agent: Agent) => void;
}

export function AgentConfigDialog({ agent, mode, open, onClose, onSave }: AgentConfigDialogProps) {
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [scopes, setScopes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      if (mode === "edit" && agent) {
        setName(agent.name);
        setSystemPrompt(
          `You are ${agent.name}, a helpful AI agent for the PING Platform. Answer questions concisely using the team's shared knowledge graph. Always cite sources.`
        );
        setScopes(new Set(agent.scopes));
      } else {
        setName("");
        setSystemPrompt("You are a helpful AI agent for the PING Platform. Answer questions concisely using the team's shared knowledge graph. Always cite sources.");
        setScopes(new Set(["general", "engineering", "product"]));
      }
    }
  }, [open, mode, agent]);

  const toggleScope = (ch: string) => {
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const result: Agent = mode === "edit" && agent
      ? { ...agent, name: name.trim(), scopes: Array.from(scopes) }
      : {
          id: String(Date.now()),
          name: name.trim(),
          description: systemPrompt.slice(0, 120),
          status: "active",
          scopes: Array.from(scopes),
          queryCount: 0,
          color: AGENT_COLORS[Math.floor(Math.random() * AGENT_COLORS.length)],
        };
    onSave?.(result);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-subtle bg-surface-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "create" ? "Create agent" : `Configure ${agent?.name ?? ""}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KnowledgeBot"
              className="w-full rounded border border-subtle bg-surface-3 px-2.5 py-1.5 text-xs text-foreground placeholder:text-white/25 focus:border-white/20 focus:outline-none"
              autoFocus
            />
          </div>

          {/* System prompt */}
          <div>
            <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full resize-none rounded border border-subtle bg-surface-3 px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-white/25 focus:border-white/20 focus:outline-none"
            />
          </div>

          {/* Knowledge scope */}
          <div>
            <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
              Knowledge Scope
            </label>
            <p className="mb-2 text-2xs text-muted-foreground">
              Channels this agent can access. Exclude sensitive channels.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CHANNELS.map((ch) => {
                const included = scopes.has(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleScope(ch)}
                    className={cn(
                      "rounded border px-2 py-0.5 text-2xs transition-colors",
                      included
                        ? "border-ping-purple/40 bg-ping-purple/10 text-ping-purple"
                        : "border-subtle bg-surface-3 text-white/30 hover:text-white/50"
                    )}
                  >
                    #{ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!name.trim()}
              className="h-7 bg-ping-purple text-xs text-white hover:bg-ping-purple-hover disabled:opacity-40"
              onClick={handleSave}
            >
              {mode === "create" ? "Create agent" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
