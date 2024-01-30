import React, { useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Headers } from '@/lib/schemas';
import { ViewStepComponent } from '@/hooks/use-multistep-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IOSelection } from './IOSelectionForm';

export const HeaderSelectionSchema = z.object({
  privacyFormIdentifierHeader: z.string(),
  privacyFormConsentHeader: z.string(),
  surveyIdentifierHeader: z.string(),
});
export type HeaderSelection = z.infer<typeof HeaderSelectionSchema>;

export const HeaderSelectionForm: ViewStepComponent<[IOSelection, Headers], HeaderSelection> = ({ data, push }) => {
  const form = useForm({
    resolver: zodResolver(HeaderSelectionSchema),
    defaultValues: {
      privacyFormIdentifierHeader: data[1].privacyFormFileHeaders[0],
      privacyFormConsentHeader: data[1].privacyFormFileHeaders[1],
      surveyIdentifierHeader: data[1].surveyFileHeaders[0],
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })
  const { privacyFormFileHeaders, surveyFileHeaders } = data[1];
  const [isPopover1Open, setIsPopover1Open] = useState(false);
  const [isPopover2Open, setIsPopover2Open] = useState(false);
  const [isPopover3Open, setIsPopover3Open] = useState(false);
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(push)} className={cn("flex flex-col space-y-10")}>
        <div className={cn("text-sm bg-yellow-100 px-4 py-2 rounded")}>
          <strong>Note:</strong> If the columns offered here don't look right, you might have selected the wrong separator.
        </div>
      <FormField
          control={form.control}
          name="privacyFormIdentifierHeader"
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
                            form.setValue("privacyFormIdentifierHeader", sep)
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
          name="privacyFormConsentHeader"
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
                            setIsPopover2Open(false)
                            form.setValue("privacyFormConsentHeader", sep)
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
                Select the column that contains the consent in the privacy form file.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      <FormField
          control={form.control}
          name="surveyIdentifierHeader"
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
                        "w-[300px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <span className={cn("truncate")}>{field.value
                        ? surveyFileHeaders.find(sep => sep === field.value)
                        : "Select column"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandGroup>
                      {surveyFileHeaders.map(sep => (
                        <CommandItem
                          value={sep}
                          key={sep}
                          onSelect={() => {
                            setIsPopover3Open(false)
                            form.setValue("surveyIdentifierHeader", sep)
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
};
