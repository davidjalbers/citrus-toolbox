import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';

import { Button } from '@dja/ui/components/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Headers } from '@/lib/schemas';
import { ViewStepComponent } from '@/hooks/use-multistep-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IOSelection } from './IOSelectionForm';
import { Input } from '@dja/ui';

const requiredString = z.string().min(1, 'This field is required.');

export const HeaderSelectionSchema = z.object({
  privacyFormIdentifierHeader: requiredString,
  privacyFormConsentHeader: requiredString,
  privacyFormConsentValue: requiredString,
  surveyIdentifierHeader: requiredString,
});
export type HeaderSelection = z.infer<typeof HeaderSelectionSchema>;

export const HeaderSelectionForm: ViewStepComponent<[IOSelection, Headers], HeaderSelection> = ({
  data,
  push,
  pop,
}) => {
  const form = useForm<HeaderSelection>({
    resolver: zodResolver(HeaderSelectionSchema),
    defaultValues: {
      privacyFormIdentifierHeader: '',
      privacyFormConsentHeader: '',
      privacyFormConsentValue: '',
      surveyIdentifierHeader: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });
  const isLoading = form.formState.isSubmitting;
  const { privacyFormFileHeaders: raw_privacyFormFileHeaders, surveyFileHeaders: raw_surveyFileHeaders } = data[1];
  const transformArray = (strings: string[]): { label: string; value: string }[] => {
    return strings.map((str, index) => ({ label: str, value: index.toString() }));
  };
  const privacyFormFileHeaders = transformArray(raw_privacyFormFileHeaders);
  const surveyFileHeaders = transformArray(raw_surveyFileHeaders);
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(push)} className={cn('flex flex-col space-y-10')}>
        <div className={cn('text-sm bg-yellow-100 px-4 py-2 rounded')}>
          <strong>Note:</strong> If the columns offered here don't look right, you might have selected the wrong
          separator.
        </div>
        <FormField
          control={form.control}
          name="privacyFormIdentifierHeader"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={cn('font-bold')}>Privacy Form Study Code Column</FormLabel>
              <HeaderCombobox value={field.value} onChange={field.onChange} options={privacyFormFileHeaders} />
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
              <FormLabel className={cn('font-bold')}>Privacy Form Consent Column</FormLabel>
              <HeaderCombobox value={field.value} onChange={field.onChange} options={privacyFormFileHeaders} />
              <FormDescription>Select the column that contains the consent in the privacy form file.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacyFormConsentValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn('font-bold')}>Privacy Form Consent Value</FormLabel>
              <FormControl>
                <Input {...field} spellCheck={false} placeholder="Yes, I consent" />
              </FormControl>
              <FormDescription>
                Specify the exact string to interpret as valid consent. All other values will be deemed as the
                participant not consenting.
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
              <FormLabel className={cn('font-bold')}>Survey Study Code Column</FormLabel>
              <HeaderCombobox value={field.value} onChange={field.onChange} options={surveyFileHeaders} />
              <FormDescription>Select the column that contains the study code in the survey file.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={cn('flex gap-2')}>
          <Button type="button" size="lg" variant="secondary" onClick={pop}>
            Back
          </Button>
          <Button type="submit" size="lg" disabled={isLoading} className={cn('flex-grow')}>
            {isLoading && (
              <>
                <Loader2 className={cn('animate-spin inline-block mr-2')} />
                Working...
              </>
            )}
            {!isLoading && 'Run job'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

type ComboboxProps = {
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

const HeaderCombobox: FC<ComboboxProps> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[500px] justify-between', !value && 'text-muted-foreground')}
        >
          <span className={cn('truncate')}>
            {value ? options.find(option => option.value === value)?.label : 'Select column'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command
          filter={(value, search) => {
            if (options[parseInt(value, 10)].label.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search column..." />
          <CommandEmpty>No column found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={currentValue => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4 min-h-4 min-w-4', value === option.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
