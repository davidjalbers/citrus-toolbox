import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export type Step = {
  num: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
};

export interface StepsProps {
  steps: Step[];
  className?: string;
}

export function Steps({ steps, className }: StepsProps) {
  return (
    <ol
      role="list"
      className={cn(
        'divide-y divide-border rounded-md border border-border sm:flex sm:divide-y-0',
        className,
      )}
    >
      {steps.map((step, stepIdx) => (
        <li key={step.name} className="relative sm:flex sm:flex-1">
          {step.status === 'completed' ? (
            <div className="flex w-full items-center">
              <span className="flex items-center px-6 py-4 text-sm font-medium">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                  <CheckIcon
                    className="h-6 w-6 text-primary-foreground"
                    aria-hidden="true"
                  />
                </span>
                <span className="ml-4 text-sm font-medium text-primary">
                  {step.name}
                </span>
              </span>
            </div>
          ) : step.status === 'current' ? (
            <div
              className="flex items-center px-6 py-4 text-sm font-medium"
              aria-current="step"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                <span className="text-primary">{step.num}</span>
              </span>
              <span className="ml-4 text-sm font-medium text-primary">
                {step.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="flex items-center px-6 py-4 text-sm font-medium">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-border">
                  <span className="text-muted-foreground">{step.num}</span>
                </span>
                <span className="ml-4 text-sm font-medium text-muted-foreground">
                  {step.name}
                </span>
              </span>
            </div>
          )}

          {stepIdx !== steps.length - 1 ? (
            <>
              {/* Arrow separator for lg screens and up */}
              <div
                className="absolute right-0 top-0 hidden h-full w-5 sm:block"
                aria-hidden="true"
              >
                <svg
                  className="h-full w-full text-border"
                  viewBox="0 0 22 80"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 -2L20 40L0 82"
                    vectorEffect="non-scaling-stroke"
                    stroke="currentcolor"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
