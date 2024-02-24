import React, { useEffect } from 'react';

import { useTitleContext } from '@/components/title-context';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Steps } from '@/components/ui/steps';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { JobResultDisplay } from '@/components/ps-matcher/JobResultDisplay';
import { useMultistepForm } from '@/hooks/use-multistep-form';
import { IOSelectionForm } from '@/components/ps-matcher/IOSelectionForm';
import { HeaderSelectionForm } from '@/components/ps-matcher/HeaderSelectionForm';

import { author } from '@/package.json';

export function PSMatcherPage() {
  const { setTitle } = useTitleContext();
  useEffect(() => setTitle('P+S Matcher'), []);

  const { viewSteps, viewStepIndex, currentViewStep } = useMultistepForm(form =>
    form
      .addViewStep({
        num: '01',
        name: 'Input selection',
        element: IOSelectionForm,
      })
      .addDataStep(steps => electron.processInputSelection(steps[0]))
      .addViewStep({
        num: '02',
        name: 'Column definition',
        element: HeaderSelectionForm,
      })
      .addDataStep(steps => electron.processColumnDefinitionAndRunJob({ ...steps[0], ...steps[2] }))
      .addViewStep({
        num: '03',
        name: 'Results',
        element: JobResultDisplay,
      }),
  );

  return (
    <main>
      <Card>
        <CardHeader className={cn('p-0')}>
          <Steps
            steps={viewSteps.map(step => {
              if (step.name == 'Results' && viewStepIndex == 2) return { ...step, status: 'completed' };
              return step;
            })}
            className={cn('border-none')}
          />
        </CardHeader>
        <CardContent className={cn('border-y')}>{currentViewStep}</CardContent>
        <CardFooter className={cn('block text-center')}>
          <Button
            className={cn('text-muted-foreground mt-6')}
            variant="link"
            onClick={() => electron.openExternal(`mailto:${author.email}?subject=P%2BS%20Matcher%20Issue%20Report&body=Please%20describe%20the%20issue%20you%20are%20experiencing%20below.`)}
          >
            Report an issue
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
