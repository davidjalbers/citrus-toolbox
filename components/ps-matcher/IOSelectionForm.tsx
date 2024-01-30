import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const separators = [{ value: ',', label: 'Comma ,'}, { value: ';', label: 'Semicolon ;' }] as const;

type IOSelectionFormProps = {
  form: UseFormReturn
};
export const IOSelectionForm = ({ form }: IOSelectionFormProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <Form {...form}>
      <form className={cn("flex flex-col space-y-10")}>
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
      </form>
    </Form>
  );
};
