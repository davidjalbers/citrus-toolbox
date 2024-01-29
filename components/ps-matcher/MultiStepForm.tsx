import React from "react";
import { ColumnDefinitionSchema, InputSelectionSchema } from "@/lib/schemas";
import { InputSelectionForm } from "@/components/ps-matcher/InputSelectionForm";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { useMultistepForm } from "../use-multistep-form";

import * as z from "zod";
import { ColumnDefinitionForm } from "./ColumnDefinitionForm";
import { JobResultDialog } from "./JobResultDisplay";


export function MultiStepForm() {
  const { cachedData, steps, currentStepIdx, currentStep, isLoading, form, handleForward, handleBackward } = useMultistepForm([
    { 
      num: '01', 
      name: 'Input selection', 
      backward: undefined, 
      forward: 'Continue',
      Content: InputSelectionForm,
      schema: InputSelectionSchema,
      onForward: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await electron.processInputSelection(data);
      },
      defaultValues: {
        separator: ',',
        privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
        surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
        outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
      },
    },
    { 
      num: '02', 
      name: 'Column definition', 
      backward: 'Back',
      forward: 'Run job', 
      Content: ColumnDefinitionForm,
      schema: ColumnDefinitionSchema,
      onForward: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { result: await electron.processColumnDefinitionAndRunJob(data) };
      },
      defaultValues: {},
    },
    { 
      num: '03', 
      name: 'Results', 
      backward: undefined, 
      forward: undefined, 
      Content: JobResultDialog,
    },
  ]);
  
  const { Content, forward, backward } = currentStep;
  return (
    <Card>
      <CardHeader className={cn("p-0")}>
        <Steps steps={steps.map((step, idx) => ({ ...step, status: currentStepIdx > idx ? 'completed' : (currentStepIdx ==  idx ? 'current' : 'pending') }))} className={cn("border-none")} />
      </CardHeader>
      <CardContent className={cn("border-y")}>
        <Content form={form} {...cachedData} />
      </CardContent>
      {(backward || forward) && (
        <CardFooter className={cn("block text-center pt-6")}>
          <div className={cn("flex gap-2")}>
            {backward && (<Button type="button" size="lg" variant="secondary" onClick={handleBackward}>{backward}</Button>)}
            {forward && (<Button type="button" size="lg" disabled={isLoading} className={cn("flex-grow")} onClick={handleForward}>
              { isLoading ? (
                <>
                  <Loader2 className={cn("animate-spin inline-block mr-2")} />
                  Working...
                </>
              ) : (
                <>{forward}</>
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
  );
}
