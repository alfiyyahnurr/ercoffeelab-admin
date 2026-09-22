import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  aliases?: string[];
}

interface StatusStepperProps {
  steps: StepItem[];
  currentStepId: string;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

export function StatusStepper({
  steps,
  currentStepId,
  className = '',
  onStepClick,
}: StatusStepperProps) {
  const normCurrent = (currentStepId || '').toLowerCase();

  // Find index using direct match or aliases
  const currentIndex = steps.findIndex((s) => {
    const sId = s.id.toLowerCase();
    if (sId === normCurrent) return true;
    if (s.aliases && s.aliases.some((a) => a.toLowerCase() === normCurrent)) return true;
    // Default fallback mappings
    if (sId === 'pending' && ['confirmed', 'paid', 'checkout'].includes(normCurrent)) return true;
    if (sId === 'ready' && ['on_delivery', 'delivering'].includes(normCurrent)) return true;
    return false;
  });

  return (
    <div className={`stepper ${className}`}>
      {steps.map((step, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = currentIndex >= 0 && index === currentIndex;
        const isLast = index === steps.length - 1;

        let stepState = 'pending';
        if (isDone) stepState = 'done';
        else if (isCurrent) stepState = 'current';

        const isClickable = Boolean(onStepClick);

        return (
          <React.Fragment key={step.id}>
            <div
              className={`step ${stepState} ${isClickable ? 'cursor-pointer select-none hover:opacity-90' : ''}`}
              onClick={() => onStepClick && onStepClick(step.id)}
            >
              <div className="step-dot">
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>

            {!isLast && (
              <div
                className={`step-divider ${
                  currentIndex >= 0 && index < currentIndex ? 'done' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
