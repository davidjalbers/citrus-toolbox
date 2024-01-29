import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { InputSelectionResult } from '@/lib/schemas';

type ColumnDefinitionFormProps = {
  form: UseFormReturn
} & InputSelectionResult;
export const ColumnDefinitionForm = ({ form, privacyFormFileHeaders, surveyFileHeaders }: ColumnDefinitionFormProps) => {
  const [isPopover1Open, setIsPopover1Open] = useState(false);
  const [isPopover2Open, setIsPopover2Open] = useState(false);
  const [isPopover3Open, setIsPopover3Open] = useState(false);
  const [isPopover4Open, setIsPopover4Open] = useState(false);
  const [isPopover5Open, setIsPopover5Open] = useState(false);
  return (
    <Form {...form}>
      <form className={cn("flex flex-col space-y-10")}>
      <FormField
          control={form.control}
          name="privacyFormIndexColumn"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={cn("font-bold")}>Privacy Form Index</FormLabel>
              <Popover open={isPopover4Open} onOpenChange={setIsPopover4Open}>
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
                            setIsPopover4Open(false)
                            form.setValue("privacyFormIndexColumn", sep)
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
                Select the column that contains the index in the privacy form file.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
                          {sep}
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
          name="surveyIndexColumn"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={cn("font-bold")}>Survey Index</FormLabel>
              <Popover open={isPopover5Open} onOpenChange={setIsPopover5Open}>
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
                            setIsPopover5Open(false)
                            form.setValue("surveyIndexColumn", sep)
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
                Select the column that contains the index in the survey file.
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
      </form>
    </Form>
  );
};
