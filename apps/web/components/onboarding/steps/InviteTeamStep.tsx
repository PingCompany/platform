"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Plus, X, Send, Check } from "lucide-react";

interface InviteRow {
  email: string;
  role: "admin" | "member";
  status: "pending" | "sent" | "error";
  error?: string;
}

interface InviteTeamStepProps {
  onNext: () => void;
}

export function InviteTeamStep({ onNext }: InviteTeamStepProps) {
  const [rows, setRows] = useState<InviteRow[]>([
    { email: "", role: "member", status: "pending" },
  ]);
  const [sending, setSending] = useState(false);

  const sendInvitation = useMutation(api.invitations.send);

  const updateRow = (index: number, updates: Partial<InviteRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { email: "", role: "member", status: "pending" },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendAll = async () => {
    const toSend = rows.filter(
      (r) => r.email.trim() && r.status !== "sent",
    );
    if (toSend.length === 0) {
      onNext();
      return;
    }

    setSending(true);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.email.trim() || row.status === "sent") continue;

      try {
        await sendInvitation({ email: row.email.trim(), role: row.role });
        updateRow(i, { status: "sent" });
      } catch (err) {
        updateRow(i, {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to send",
        });
      }
    }
    setSending(false);
  };

  const allSent = rows.every(
    (r) => !r.email.trim() || r.status === "sent",
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Invite your team
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          PING works best with your whole team. Invite them now or do it later
          from settings.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="email"
              value={row.email}
              onChange={(e) => updateRow(i, { email: e.target.value })}
              placeholder="teammate@company.com"
              className="flex-1 border-subtle bg-surface-2"
              disabled={row.status === "sent"}
            />
            <select
              value={row.role}
              onChange={(e) =>
                updateRow(i, { role: e.target.value as "admin" | "member" })
              }
              className="h-9 rounded-md border border-subtle bg-surface-2 px-2 text-xs text-foreground"
              disabled={row.status === "sent"}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {row.status === "sent" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                disabled={rows.length <= 1}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {rows.some((r) => r.status === "error") && (
          <p className="text-2xs text-red-400">
            {rows.find((r) => r.status === "error")?.error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-ping-purple hover:text-ping-purple/80"
      >
        <Plus className="h-3.5 w-3.5" />
        Add another
      </button>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="text-xs text-muted-foreground"
        >
          Skip
        </Button>
        {allSent ? (
          <Button
            size="sm"
            onClick={onNext}
            className="bg-ping-purple px-6 text-xs text-white hover:bg-ping-purple/90"
          >
            Finish setup
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSendAll}
            disabled={sending}
            className="bg-ping-purple px-6 text-xs text-white hover:bg-ping-purple/90"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? "Sending…" : "Send invites"}
          </Button>
        )}
      </div>
    </div>
  );
}
