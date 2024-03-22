import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input, Button } from '@dja/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ViewStepComponent } from '@/hooks/use-multistep-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '../ui/checkbox';

const filePath = z
  .string()
  .trim()
  .min(1, 'This field is required.')
  .refine(value => electron.validatePath({ path: value }), 'This file either does not exist or is not readable.')
  .refine(value => value.endsWith('.csv'), 'Only CSV files are supported.');
const directoryPath = z
  .string()
  .trim()
  .min(1, 'This field is required.')
  .refine(
    value =>
      electron.validatePath({
        path: value,
        type: 'directory',
        access: 'readWrite',
      }),
    'This directory either does not exist or is not writable.',
  );
const separators = [
  { value: ',', label: 'Comma ,' },
  { value: ';', label: 'Semicolon ;' },
] as const;

export const IOSelectionSchema = z.object({
  separator: z.string() /*z.enum([';', ','])*/,
  privacyFormFilePath: filePath,
  surveyFilePath: filePath,
  outputDirectoryPath: directoryPath,
  replaceNewlines: z.boolean(),
});
export type IOSelection = z.infer<typeof IOSelectionSchema>;

export const IOSelectionForm: ViewStepComponent<[], IOSelection> = ({ push }) => {
  const form = useForm({
    resolver: zodResolver(IOSelectionSchema),
    defaultValues: {
      separator: ',',
      privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
      surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
      outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
      replaceNewlines: false,
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });
  const isLoading = form.formState.isSubmitting;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(push)} className={cn('flex flex-col space-y-10')}>
        <FormField
          control={form.control}
          name="separator"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={cn('font-bold')}>Separator</FormLabel>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn('w-[200px] justify-between', !field.value && 'text-muted-foreground')}
                    >
                      {field.value ? separators.find(sep => sep.value === field.value)?.label : 'Select separator'}
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
                            setIsPopoverOpen(false);
                            form.setValue('separator', sep.value);
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', sep.value === field.value ? 'opacity-100' : 'opacity-0')}
                          />
                          {sep.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Specify whether the input files are comma or semicolon separated.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacyFormFilePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn('font-bold')}>Privacy Form File Path</FormLabel>
              <FormControl>
                <div className={cn('flex gap-2')}>
                  <Input {...field} spellCheck={false} placeholder="/path/to/privacy.csv" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const path = await electron.selectPath();
                      if (path)
                        form.setValue('privacyFormFilePath', path, {
                          shouldValidate: true,
                        });
                    }}
                  >
                    Select file
                  </Button>
                </div>
              </FormControl>
              <FormDescription>Enter the path to the privacy form file or select it.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surveyFilePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn('font-bold')}>Survey File Path</FormLabel>
              <FormControl>
                <div className={cn('flex gap-2')}>
                  <Input {...field} spellCheck={false} placeholder="/path/to/survey.csv" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const path = await electron.selectPath();
                      if (path)
                        form.setValue('surveyFilePath', path, {
                          shouldValidate: true,
                        });
                    }}
                  >
                    Select file
                  </Button>
                </div>
              </FormControl>
              <FormDescription>Enter the path to the survey file or select it.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="outputDirectoryPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn('font-bold')}>Output Directory Path</FormLabel>
              <FormControl>
                <div className={cn('flex gap-2')}>
                  <Input {...field} spellCheck={false} placeholder="/path/to/output" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const path = await electron.selectPath({
                        type: 'directory',
                      });
                      if (path)
                        form.setValue('outputDirectoryPath', path, {
                          shouldValidate: true,
                        });
                    }}
                  >
                    Select directory
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Enter the path to the output directory or select it.
                <br />
                <strong>Caution:</strong> Existing files will be overwritten without further warning!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="replaceNewlines"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 ">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-2 leading-none">
                <FormLabel className={cn('font-bold')}>Replace Line Breaks in Output Files</FormLabel>
                <FormDescription>
                  Enabling this will replace all line breaks in the output files with slashes. This is useful for
                  importing into older versions of Microsoft Excel.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={isLoading} className={cn('flex-grow')}>
          {isLoading && (
            <>
              <Loader2 className={cn('animate-spin inline-block mr-2')} />
              Working...
            </>
          )}
          {!isLoading && 'Continue'}
        </Button>
      </form>
    </Form>
  );
};
