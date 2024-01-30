import React, { useEffect } from "react";

import { useTitleContext } from "@/components/title-context";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobResultDialog } from "@/components/ps-matcher/JobResultDisplay";
import { useMultistepForm } from "@/hooks/use-multistep-form";
import { Headers } from "@/lib/schemas";
import { JobResultStats } from "@/lib/business-logic/core";
import { IOSelection, IOSelectionForm } from "@/components/ps-matcher/IOSelectionForm";
import { HeaderSelection, HeaderSelectionForm } from "@/components/ps-matcher/HeaderSelectionForm";


export function PSMatcherPage() {
  const { setTitle } = useTitleContext();
  useEffect(() => setTitle('P+S Matcher'), []);

  const { viewSteps, viewStepIndex, currentViewStep, pop } = useMultistepForm(form => form
    .addViewStep<IOSelection>({
      num: '01',
      name: 'Input selection',
      element: IOSelectionForm,
    })
    .addDataStep<Headers>(steps => electron.processInputSelection(steps[0]))
    .addViewStep<HeaderSelection>({
      num: '02',
      name: 'Column definition',
      element: HeaderSelectionForm,
    })
    .addDataStep<JobResultStats>(steps => electron.processColumnDefinitionAndRunJob({ ...steps[0], ...steps[2] }))
    .addViewStep({
      num: '03',
      name: 'Results',
      element: ({ data: previousData }) => {
        const stats = previousData[3];
        return (
          <JobResultDialog stats={stats} />
        );
      },
    })
  );
  
  const isLoading = false;
  return (
    <main>
      <Card>
        <CardHeader className={cn("p-0")}>
          <Steps steps={viewSteps.map((step, idx) => ({ ...step, status: viewStepIndex > idx ? 'completed' : (viewStepIndex ==  idx ? 'current' : 'pending') } as { num: string, name: string, status: 'completed' | 'current' | 'pending' }))} className={cn("border-none")} />
        </CardHeader>
        <CardContent className={cn("border-y")}>
          {currentViewStep}
        </CardContent>
        {true/*(backward || forward)*/ && (
          <CardFooter className={cn("block text-center pt-6")}>
            <div className={cn("flex gap-2")}>
              {true/*backward*/ && (<Button type="button" size="lg" variant="secondary" onClick={pop}>{"Back"/*backward*/}</Button>)}
              {true/*forward*/ && (<Button type="button" size="lg" disabled={isLoading} className={cn("flex-grow")} onClick={() => { return; /* TODO */}}>
                { isLoading ? (
                  <>
                    <Loader2 className={cn("animate-spin inline-block mr-2")} />
                    Working...
                  </>
                ) : (
                  <>{"Continue"/*forward*/}</>
                )}
              </Button>)}
            </div>
            <Button 
              className={cn("text-muted-foreground mt-4")} 
              variant="link" 
              onClick={() => electron.openExternal('https://github.com/davidjalbers/citrus-toolbox/issues/new')}>
                Report an issue
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
