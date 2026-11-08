"use client";

import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { CardContainer } from "./card-container";

export interface StepperContainerProps {
  groupId: string;
  stepSections: FormSection[];
  activeStepId: string;
  onStepChange: (groupId: string, stepId: string) => void;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

/**
 * StepperContainer renders clustered 'step' container sections as a sequential wizard.
 * Supports progress tracking, step badges, custom styling, and responsive layout.
 */
export function StepperContainer({
  groupId,
  stepSections,
  activeStepId,
  onStepChange,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: StepperContainerProps) {
  const currentStepId = activeStepId || stepSections[0]?.id;
  const currentStepIndex = stepSections.findIndex((s) => s.id === currentStepId);
  const activeSection = stepSections.find((s) => s.id === currentStepId) || stepSections[0];

  const activeConfig = activeSection?.containerConfig || {};

  return (
    <div
      className={cn(
        "rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden space-y-2 p-3",
        activeConfig.customClass,
      )}
    >
      {/* Stepper Progress Bar */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 select-none overflow-x-auto">
        {stepSections.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = idx < currentStepIndex;
          const config = step.containerConfig || {};
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(groupId, step.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer whitespace-nowrap",
                isCurrent
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : isCompleted
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "text-muted-foreground hover:bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center size-4 rounded-full text-[10px] font-mono",
                  isCurrent
                    ? "bg-primary-foreground text-primary font-bold"
                    : "border border-border text-muted-foreground",
                )}
              >
                {idx + 1}
              </span>
              <span>{step.groupTitle || step.title || `Step ${idx + 1}`}</span>
              {config.badge && (
                <span className="inline-flex items-center px-1 text-[9px] font-mono rounded bg-muted/60">
                  {config.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Step Body */}
      {activeSection && (
        <CardContainer
          key={activeSection.id}
          section={activeSection}
          values={values}
          onChange={onChange}
          errors={errors}
          disabled={disabled}
          mode={mode}
          hideHeader
        />
      )}
    </div>
  );
}
