"use client";

import { Button } from "@/components/ui/button";
import { Github, Layers, MessageSquare } from "lucide-react";

interface IntegrationsStepProps {
  onNext: () => void;
}

const INTEGRATIONS = [
  {
    name: "GitHub",
    description: "Get PR review nudges and code-related alerts",
    icon: Github,
    comingSoon: true,
  },
  {
    name: "Linear",
    description: "Track blocked tasks and project updates",
    icon: Layers,
    comingSoon: true,
  },
  {
    name: "Slack",
    description: "Import existing conversations and channels",
    icon: MessageSquare,
    comingSoon: true,
  },
];

export function IntegrationsStep({ onNext }: IntegrationsStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Connect your tools
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Integrations help PING surface relevant alerts from your existing
          workflow.
        </p>
      </div>

      <div className="space-y-2">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.name}
              className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-2 px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">
                  {integration.name}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {integration.description}
                </p>
              </div>
              <span className="rounded-full border border-subtle px-2.5 py-0.5 text-2xs text-muted-foreground">
                Coming soon
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          onClick={onNext}
          className="bg-ping-purple px-6 text-xs text-white hover:bg-ping-purple/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
