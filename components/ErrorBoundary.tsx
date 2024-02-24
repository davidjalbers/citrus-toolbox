import React, { ReactNode } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import {
  FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const FallbackComponent: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <Card className={cn('m-5 p-8 text-center text-destructive')}>
      <AlertTriangleIcon className={cn('inline h-12 w-12 mb-2')} />
      <h1 className={cn('text-2xl font-bold mb-4')}>Something went wrong</h1>
      <p className={cn('mb-4')}>
        The most likely cause for an error like this is malformed input data.
        Please ensure that the input files are valid and readable and then try
        again. If the error persists, please report it including the below stack
        trace.
      </p>
      <p className={cn('mb-8')}>
        <span className={cn('font-mono')}>{error.toString()}</span>
        <br />
        <Button
          variant="link"
          className={cn('text-destructive')}
          onClick={() => {
            navigator.clipboard.writeText(error.stack);
          }}
        >
          Click here to copy stack trace to clipboard
        </Button>
      </p>
      <Button variant="secondary" size="lg" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </Card>
  );
};

export const ErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent}>
      {children}
    </ReactErrorBoundary>
  );
};
