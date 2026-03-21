"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

interface PersonalContextStepProps {
  userName: string;
  role: "admin" | "member";
  onNext: () => void;
}

export function PersonalContextStep({
  userName,
  role,
  onNext,
}: PersonalContextStepProps) {
  const [name, setName] = useState(userName);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [workContext, setWorkContext] = useState("");
  const [bio, setBio] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [saving, setSaving] = useState(false);

  const savePersonalContext = useMutation(api.onboarding.savePersonalContext);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleNext = async () => {
    setSaving(true);
    try {
      // Update name if changed
      if (name !== userName) {
        await updateProfile({ name });
      }

      const expertise =
        expertiseInput.trim()
          ? expertiseInput.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined;

      await savePersonalContext({
        title: title || undefined,
        department: department || undefined,
        bio: bio || undefined,
        expertise,
        workContext: workContext || undefined,
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
          Tell us about yourself
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This helps PING personalize your experience and route the right
          information to you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Display name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="border-subtle bg-surface-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Job title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Engineer, Product Manager"
            className="border-subtle bg-surface-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Department
          </label>
          <Input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering, Design, Product"
            className="border-subtle bg-surface-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            What do you work on?
          </label>
          <Textarea
            value={workContext}
            onChange={(e) => setWorkContext(e.target.value)}
            placeholder="e.g. I work on the payments backend and API integrations"
            className="border-subtle bg-surface-2"
            rows={2}
          />
        </div>

        {role === "member" && (
          <>
            <div>
              <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
                Expertise areas
              </label>
              <Input
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="e.g. React, TypeScript, infrastructure (comma-separated)"
                className="border-subtle bg-surface-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
                Short bio for your team
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A quick intro so your teammates know who you are"
                className="border-subtle bg-surface-2"
                rows={2}
              />
            </div>
          </>
        )}
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
