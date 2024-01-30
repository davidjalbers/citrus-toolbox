import React, { useState } from "react";
import { Headers, HeaderSelection, HeaderSelectionSchema, IOSelection, IOSelectionSchema } from "@/lib/schemas";
import { IOSelectionForm } from "@/components/ps-matcher/IOSelectionForm";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { useMultistepForm } from "../use-multistep-form";

import { HeaderSelectionForm } from "./HeaderSelectionForm";
import { JobResultDialog } from "./JobResultDisplay";
import { useMultistepForm2 } from "@/components/use-multistep-form2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { JobResult, JobResultStats } from "@/lib/business-logic/core";


const separators = [{ value: ',', label: 'Comma ,'}, { value: ';', label: 'Semicolon ;' }] as const;

export function MultiStepForm() {
  // const { cachedData, steps, currentStepIdx, currentStep, isLoading, form, handleForward, handleBackward } = useMultistepForm([
  //   { 
  //     num: '01', 
  //     name: 'Input selection', 
  //     backward: undefined, 
  //     forward: 'Continue',
  //     Content: InputSelectionForm,
  //     schema: IOSelectionSchema,
  //     onForward: async (data: any) => {
  //       await new Promise(resolve => setTimeout(resolve, 1000));
  //       return await electron.processInputSelection(data);
  //     },
  //     defaultValues: {
  //       separator: ',',
  //       privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
  //       surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
  //       outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
  //     },
  //   },
  //   { 
  //     num: '02', 
  //     name: 'Column definition', 
  //     backward: 'Back',
  //     forward: 'Run job', 
  //     Content: ColumnDefinitionForm,
  //     schema: HeaderSelectionSchema,
  //     onForward: async (data: any) => {
  //       await new Promise(resolve => setTimeout(resolve, 1000));
  //       return { stats: await electron.processColumnDefinitionAndRunJob(data) };
  //     },
  //     defaultValues: {},
  //   },
  //   { 
  //     num: '03', 
  //     name: 'Results', 
  //     backward: undefined, 
  //     forward: undefined, 
  //     Content: JobResultDialog,
  //   },
  // ]);

  const { steps, currentStepIdx, renderCurrentStep, pop } = useMultistepForm2(form => form
    .addInputStep<IOSelection>({
      num: '01',
      name: 'Input selection',
      render: ({ submitStep }) => {
        const form = useForm({
          resolver: zodResolver(IOSelectionSchema),
          defaultValues: {
            separator: ',',
            privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
            surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
            outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
          },
          mode: 'onSubmit',
          reValidateMode: 'onBlur',
        });
        const [isPopoverOpen, setIsPopoverOpen] = useState(false);
        const [isPopover2Open, setIsPopover2Open] = useState(false);
        const [isPopover3Open, setIsPopover3Open] = useState(false);
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitStep)} className={cn("flex flex-col space-y-10")}>
              <FormField
                control={form.control}
                name="separator"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={cn("font-bold")}>Separator</FormLabel>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? separators.find(sep => sep.value === field.value)?.label
                              : "Select separator"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandGroup>
                            {separators.map(sep => (
                              <CommandItem
                                value={sep.label}
                                key={sep.value}
                                onSelect={() => {
                                  setIsPopoverOpen(false)
                                  form.setValue("separator", sep.value)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sep.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {sep.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Specify whether the input files are comma or semicolon separated.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="privacyFormFilePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn("font-bold")}>Privacy Form File Path</FormLabel>
                    <FormControl>
                      <div className={cn("flex gap-2")}>
                        <Input {...field} spellCheck={false} placeholder='/path/to/privacy.csv'/>
                        <Button type="button" variant="secondary" onClick={async () => {
                          const path = await electron.selectPath();
                          if (path) form.setValue('privacyFormFilePath', path, { shouldValidate: true });
                        }}>Select file</Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the path to the privacy form file or select it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surveyFilePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn("font-bold")}>Survey File Path</FormLabel>
                    <FormControl >
                      <div className={cn("flex gap-2")}>
                        <Input {...field} spellCheck={false} placeholder='/path/to/survey.csv'/>
                        <Button type="button" variant="secondary" onClick={async () => {
                          const path = await electron.selectPath();
                          if (path) form.setValue('surveyFilePath', path, { shouldValidate: true });
                        }}>Select file</Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the path to the survey file or select it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outputDirectoryPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn("font-bold")}>Output Directory Path</FormLabel>
                    <FormControl>
                      <div className={cn("flex gap-2")}>
                        <Input {...field} spellCheck={false} placeholder='/path/to/output' />
                        <Button type="button" variant="secondary" onClick={async () => {
                          const path = await electron.selectPath({ type: 'directory' });
                          if (path) form.setValue('outputDirectoryPath', path, { shouldValidate: true });
                        }}>Select directory</Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the path to the output directory or select it.<br />
                      <strong>Caution:</strong> Existing files will be overwritten without further warning!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Continue</Button>
            </form>
          </Form>
        )
      },
    })
    .addTransformStep<Headers>(({ steps }) => electron.processInputSelection(steps[0]))
    .addInputStep<HeaderSelection>({
      num: '02',
      name: 'Column definition',
      render: ({ steps, submitStep }) => {
        const form = useForm({
          resolver: zodResolver(HeaderSelectionSchema),
          defaultValues: {
            privacyFormStudyCodeColumn: steps[1].privacyFormFileHeaders[0],
            privacyFormConsentColumn: steps[1].privacyFormFileHeaders[1],
            surveyStudyCodeColumn: steps[1].surveyFileHeaders[0],
          },
          mode: 'onSubmit',
          reValidateMode: 'onBlur',
        })
        const { privacyFormFileHeaders, surveyFileHeaders } = steps[1];
        const [isPopover1Open, setIsPopover1Open] = useState(false);
        const [isPopover2Open, setIsPopover2Open] = useState(false);
        const [isPopover3Open, setIsPopover3Open] = useState(false);
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitStep)} className={cn("flex flex-col space-y-10")}>
            <FormField
                control={form.control}
                name="privacyFormStudyCodeColumn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={cn("font-bold")}>Privacy Form Study Code</FormLabel>
                    <Popover open={isPopover1Open} onOpenChange={setIsPopover1Open}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[300px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <span className={cn("truncate")}>{field.value
                              ? privacyFormFileHeaders.find(sep => sep === field.value)
                              : "Select column"}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandGroup>
                            {privacyFormFileHeaders.map(sep => (
                              <CommandItem
                                value={sep}
                                key={sep}
                                onSelect={() => {
                                  setIsPopover1Open(false)
                                  form.setValue("privacyFormStudyCodeColumn", sep)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sep === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span>{sep}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the column that contains the study code in the privacy form file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="privacyFormConsentColumn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={cn("font-bold")}>Privacy Form Consent</FormLabel>
                    <Popover open={isPopover2Open} onOpenChange={setIsPopover2Open}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? privacyFormFileHeaders.find(sep => sep === field.value)
                              : "Select column"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandGroup>
                            {privacyFormFileHeaders.map(sep => (
                              <CommandItem
                                value={sep}
                                key={sep}
                                onSelect={() => {
                                  setIsPopover2Open(false)
                                  form.setValue("privacyFormConsentColumn", sep)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sep === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {sep}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the column that contains the consent in the privacy form file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="surveyStudyCodeColumn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={cn("font-bold")}>Survey Study Code</FormLabel>
                    <Popover open={isPopover3Open} onOpenChange={setIsPopover3Open}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? surveyFileHeaders.find(sep => sep === field.value)
                              : "Select column"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandGroup>
                            {surveyFileHeaders.map(sep => (
                              <CommandItem
                                value={sep}
                                key={sep}
                                onSelect={() => {
                                  setIsPopover3Open(false)
                                  form.setValue("surveyStudyCodeColumn", sep)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sep === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {sep}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the column that contains the study code in the survey file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Run job</Button>
            </form>
          </Form>
        );
      },
    })
    .addTransformStep<JobResultStats>(({ steps }) => electron.processColumnDefinitionAndRunJob({
      separator: steps[0].separator,
      privacyFormFilePath: steps[0].privacyFormFilePath,
      surveyFilePath: steps[0].surveyFilePath,
      outputDirectoryPath: steps[0].outputDirectoryPath,
      privacyFormStudyCodeColumn: steps[2].privacyFormIdentifierHeader,
      privacyFormConsentColumn: steps[2].privacyFormConsentHeader,
      surveyStudyCodeColumn: steps[2].surveyIdentifierHeader,
    }))
    .addInputStep<never>({
      num: '03',
      name: 'Results',
      render: ({ steps }) => {
        const stats = steps[3];
        const [isPopoverOpen, setIsPopoverOpen] = useState(false);
        const [isPopover2Open, setIsPopover2Open] = useState(false);
        const [isPopover3Open, setIsPopover3Open] = useState(false);
        return (
          <JobResultDialog stats={stats} />
        );
      },
    })
  );
  
  //const { Content, forward, backward } = currentStep;
  const isLoading = false;
  return (
    <Card>
      <CardHeader className={cn("p-0")}>
        <Steps steps={steps.filter(step => typeof step !== 'function').map((step, idx) => ({ ...step, status: currentStepIdx > idx ? 'completed' : (currentStepIdx ==  idx ? 'current' : 'pending') } as { num: string, name: string, status: 'completed' | 'current' | 'pending' }))} className={cn("border-none")} />
      </CardHeader>
      <CardContent className={cn("border-y")}>
        {renderCurrentStep()}
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
  );
}
