import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export type UseMultiStepFormArg = (
  { num: string, name: string, Content: React.ElementType } & (
    { forward: string, schema: z.Schema, onForward: (data: any) => any | Promise<any>, defaultValues: any } |
    { forward: undefined }
  ) & (
    { backward: string } |
    { backward: undefined }
  )
)[];

export function useMultistepForm(steps: UseMultiStepFormArg) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [cachedData, setCachedData] = useState<any|undefined>(undefined);
  const currentStep = steps.at(currentStepIdx) || steps.at(-1); // TODO is defaulting to last step unsafe?
  if (!currentStep) throw new Error(`No element for step ${currentStepIdx}`);
  const handleBackward = () => setCurrentStepIdx(prev => --prev);
  if (!currentStep.forward) {
    useForm();
    useEffect(() => { return; }, [currentStepIdx]);
    return { cachedData, steps, currentStepIdx, currentStep, isLoading: false, handleBackward };
  }
  const form = useForm<z.infer<typeof currentStep.schema>>({
    resolver: zodResolver(currentStep.schema),
    defaultValues: currentStep.defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });
  useEffect(() => {
    form.reset();
  }, [currentStepIdx]);
  const isLoading = form.formState.isSubmitting;
  const handleForward = form.handleSubmit(async () => {
    setCachedData(await currentStep.onForward(form.getValues()));
    setCurrentStepIdx(prev => ++prev);
  });
  return { cachedData, steps, currentStepIdx, currentStep, isLoading, form, handleForward, handleBackward };
}