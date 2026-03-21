"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AgentCard, AgentConfigDialog, type Agent } from "@/components/bot/AgentCard";
import { useToast } from "@/components/ui/toast-provider";
import { Id } from "@convex/_generated/dataModel";

const MOCK_AGENTS: Agent[] = [
  {
    _id: "1" as Id<"agents">,
    _creationTime: Date.now(),
    name: "KnowledgeBot",
    description: "Answers questions about your team's codebase, past decisions, and historical context. Queries GitHub, Linear, and chat history with citations.",
    status: "active",
    color: "#5E6AD2",
    createdBy: "" as Id<"users">,
  },
  {
    _id: "2" as Id<"agents">,
    _creationTime: Date.now(),
    name: "SupportRouterBot",
    description: "Automatically triages incoming support messages, routes to the right team member, and drafts initial responses based on past resolution patterns.",
    status: "active",
    color: "#22C55E",
    createdBy: "" as Id<"users">,
  },
  {
    _id: "3" as Id<"agents">,
    _creationTime: Date.now(),
    name: "SprintCoach",
    description: "Monitors sprint health, flags blocked tickets, pings assignees on overdue items, and generates weekly summaries for planning meetings.",
    status: "inactive",
    color: "#F59E0B",
    createdBy: "" as Id<"users">,
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [configuring, setConfiguring] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleToggle = (id: Id<"agents">, status: "active" | "inactive") => {
    setAgents((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status } : a))
    );
    toast(status === "active" ? "Agent enabled" : "Agent disabled", "success");
  };

  const handleSave = (data: { name: string; description: string; systemPrompt: string; color: string }) => {
    if (configuring) {
      setAgents((prev) =>
        prev.map((a) =>
          a._id === configuring._id ? { ...a, ...data } : a
        )
      );
      toast("Agent updated", "success");
    } else {
      const newAgent: Agent = {
        _id: crypto.randomUUID() as Id<"agents">,
        _creationTime: Date.now(),
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        color: data.color,
        status: "active",
        createdBy: "" as Id<"users">,
      };
      setAgents((prev) => [...prev, newAgent]);
      toast("Agent created", "success");
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-md font-semibold text-foreground">Agents</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {agents.filter((a) => a.status === "active").length} active ·{" "}
            {agents.length} total agents in this workspace
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded bg-ping-purple px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ping-purple-hover"
        >
          <Plus className="h-3 w-3" />
          New Agent
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent._id}
            agent={agent}
            onToggle={handleToggle}
            onConfigure={(id) => setConfiguring(agents.find((a) => a._id === id) ?? null)}
          />
        ))}

        {/* Create new */}
        <button
          onClick={() => setCreating(true)}
          className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-foreground/10 bg-transparent py-10 text-center transition-colors hover:border-foreground/20 hover:bg-surface-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-foreground/15">
            <Plus className="h-4 w-4 text-foreground/30" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Create agent</p>
            <p className="text-2xs text-foreground/25">Custom AI for your workflow</p>
          </div>
        </button>
      </div>

      {/* Edit dialog */}
      <AgentConfigDialog
        agent={configuring}
        mode="edit"
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        onSave={handleSave}
      />

      {/* Create dialog */}
      <AgentConfigDialog
        agent={null}
        mode="create"
        open={creating}
        onClose={() => setCreating(false)}
        onSave={handleSave}
      />
    </div>
  );
}
