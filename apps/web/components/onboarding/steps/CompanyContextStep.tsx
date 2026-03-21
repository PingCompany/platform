"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "Media",
  "Manufacturing",
  "Consulting",
  "Government",
  "Non-profit",
  "Other",
];

interface CompanyContextStepProps {
  workspaceName: string;
  onNext: () => void;
}

export function CompanyContextStep({
  workspaceName,
  onNext,
}: CompanyContextStepProps) {
  const [companyName, setCompanyName] = useState(
    workspaceName.replace(/'s Workspace$/, ""),
  );
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const saveCompanyContext = useMutation(api.onboarding.saveCompanyContext);

  const handleNext = async () => {
    setSaving(true);
    try {
      await saveCompanyContext({
        companyName: companyName || undefined,
        industry: industry || undefined,
        companySize: companySize || undefined,
        companyDescription: description || undefined,
      });
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          About your company
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This helps PING&apos;s AI understand your organization and tailor
          alerts and summaries.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Company name
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
            className="border-subtle bg-surface-2"
          />
          <p className="mt-1 text-2xs text-muted-foreground">
            This will also be your workspace name.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Company size
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPANY_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCompanySize(size)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  companySize === size
                    ? "border-ping-purple bg-ping-purple/15 text-ping-purple"
                    : "border-subtle bg-surface-2 text-muted-foreground hover:border-white/20"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Industry
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  industry === ind
                    ? "border-ping-purple bg-ping-purple/15 text-ping-purple"
                    : "border-subtle bg-surface-2 text-muted-foreground hover:border-white/20"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            What does your company do?
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. We build developer tools for infrastructure automation"
            className="border-subtle bg-surface-2"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="text-xs text-muted-foreground"
        >
          Skip
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={saving}
          className="bg-ping-purple px-6 text-xs text-white hover:bg-ping-purple/90"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
