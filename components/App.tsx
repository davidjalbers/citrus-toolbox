import React from 'react';

import { productName } from '@/package.json';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const FormSchema = z.object({
  privacyFormFilePath: z.string().refine((val) => val.length <= 10, {
    message: "String can't be more than 10 characters",
  }),
  surveyFilePath: z.string(),
  outputDirectoryPath: z.string(),
});

function JobForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
      surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
      outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
    },
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data);
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col space-y-10")}>
        <FormField
          control={form.control}
          name="privacyFormFilePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn("font-bold")}>Privacy Form File Path</FormLabel>
              <FormControl>
                <div className={cn("flex gap-1")}>
                  <Input {...field} />
                  <Button type="button">Select file</Button>
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
              <FormControl>
                <div className={cn("flex gap-1")}>
                  <Input {...field} />
                  <Button type="button">Select file</Button>
                </div>
              </FormControl>
              <FormDescription>
                Enter the path to the survey file or select it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <hr />
        <FormField
          control={form.control}
          name="outputDirectoryPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn("font-bold")}>Output Directory Path</FormLabel>
              <FormControl>
                <div className={cn("flex gap-1")}>
                  <Input {...field} />
                  <Button type="button">Select directory</Button>
                </div>
              </FormControl>
              <FormDescription>
                Enter the path to the output directory or select it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <hr />
        <Button type="submit" size="lg">Run job</Button>
      </form>
    </Form>
  );
}

const JobResultDialog = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent className={cn("rounded-lg")}>
        <AlertDialogHeader>
          <AlertDialogTitle>Job Execution Report</AlertDialogTitle>
          <AlertDialogDescription className={cn("mb-2 font-bold")}>All operations completed successfully.</AlertDialogDescription>
          <AlertDialogDescription className={cn("mb-2")}>Read input from <span className={cn("font-mono text-xs")}>`Datenschutz.csv`</span> and <span className={cn("font-mono text-xs")}>`Umfrage.csv`</span>.</AlertDialogDescription>
          <AlertDialogDescription className={cn("mb-2")}>
            Processed a total of 511 study codes in 934 entries (102 duplicates):
            <li>384 valid and usable</li>
            <li>49 without consent to use of data</li>
            <li>40 only in privacy form (no entries found in survey data)</li>
            <li>10 only in survey (no entries found privacy form data)</li>
            <li>28 invalid</li>
          </AlertDialogDescription>
        <AlertDialogDescription className={cn("mb-2")}>Output files written to <span className={cn("font-mono text-xs")}>`citrus-toolbox`</span>.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction>Copy to clipboard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const App = () => {
  return (
    <main className={cn("p-5")}>
      <h1 className={cn("font-black text-center text-4xl mb-10")}>Consent Matcher</h1>
      <JobForm />
      <JobResultDialog />
    </main>
  );
};
