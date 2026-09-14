import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
}

interface StatusStepperProps {
  steps: StepItem[];
  currentStepId: string;
  className?: string;
}

export function StatusStepper({
  steps,
  currentStepId,
  className = '',
}: StatusStepperProps) {
  const currentIndex = steps.findIndex(
    (s) => s.id.toLowerCase() === currentStepId.toLowerCase()
  );

  return (
    <div className={`stepper ${className}`}>
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        let stepState = 'pending';
        if (isDone) stepState = 'done';
        else if (isCurrent) stepState = 'current';

        return (
          <React.Fragment key={step.id}>
            <div className={`step ${stepState}`}>
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
                  index < currentIndex ? 'done' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
