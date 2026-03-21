"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { OnboardingLayout } from "./OnboardingLayout";
import { OnboardingProgress } from "./OnboardingProgress";
import { PersonalContextStep } from "./steps/PersonalContextStep";
import { CompanyContextStep } from "./steps/CompanyContextStep";
import { WorkspaceSetupStep } from "./steps/WorkspaceSetupStep";
import { AiPrefsStep } from "./steps/AiPrefsStep";
import { IntegrationsStep } from "./steps/IntegrationsStep";
import { InviteTeamStep } from "./steps/InviteTeamStep";
import { ChannelSelectionStep } from "./steps/ChannelSelectionStep";
import { CommunicationPrefsStep } from "./steps/CommunicationPrefsStep";

const ADMIN_STEPS = [
  "Personal context",
  "Company context",
  "Workspace setup",
  "AI preferences",
  "Integrations",
  "Invite team",
];

const MEMBER_STEPS = [
  "Personal context",
  "Join channels",
  "AI preferences",
  "Communication",
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const state = useQuery(api.onboarding.getOnboardingState);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  if (!state) {
    return (
      <OnboardingLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ping-purple border-t-transparent" />
        </div>
      </OnboardingLayout>
    );
  }

  // Already completed — redirect
  if (state.onboardingStatus === "completed" || !state.onboardingStatus) {
    router.replace("/inbox");
    return null;
  }

  const isAdmin = state.role === "admin";
  const steps = isAdmin ? ADMIN_STEPS : MEMBER_STEPS;
  const totalSteps = steps.length;

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding({});
      router.replace("/inbox");
    }
  };

  const renderStep = () => {
    if (isAdmin) {
      switch (step) {
        case 0:
          return (
            <PersonalContextStep
              userName={state.userName}
              role="admin"
              onNext={handleNext}
            />
          );
        case 1:
          return (
            <CompanyContextStep
              workspaceName={state.workspaceName}
              onNext={handleNext}
            />
          );
        case 2:
          return <WorkspaceSetupStep onNext={handleNext} />;
        case 3:
          return <AiPrefsStep onNext={handleNext} />;
        case 4:
          return <IntegrationsStep onNext={handleNext} />;
        case 5:
          return <InviteTeamStep onNext={handleNext} />;
        default:
          return null;
      }
    }

    // Member flow
    switch (step) {
      case 0:
        return (
          <PersonalContextStep
            userName={state.userName}
            role="member"
            onNext={handleNext}
          />
        );
      case 1:
        return <ChannelSelectionStep onNext={handleNext} />;
      case 2:
        return <AiPrefsStep onNext={handleNext} />;
      case 3:
        return <CommunicationPrefsStep onNext={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress
        currentStep={step}
        totalSteps={totalSteps}
        labels={steps}
      />
      <div className="rounded-xl border border-subtle bg-surface-1 p-6">
        {renderStep()}
      </div>
    </OnboardingLayout>
  );
}
