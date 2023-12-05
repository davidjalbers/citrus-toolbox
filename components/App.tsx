import React, { useCallback, useState } from 'react';

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
} from "@/components/ui/alert-dialog"
import { Loader2 } from 'lucide-react';


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
  const isLoading = form.formState.isSubmitting;
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
        <Button type="submit" size="lg" disabled={isLoading}>
          { isLoading ? (
            <>
              <Loader2 className={cn("animate-spin inline-block mr-2")} />
              Working...
            </>
          ) : (
            <>Run job</>
          )}
        </Button>
      </form>
    </Form>
  );
}

type JobResultDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resultData: {
    timestamp: string,
    totalStudyCodes: number,
    totalEntries: number,
    totalDuplicates: number,
    valid: number,
    noConsent: number,
    onlyPrivacyForm: number,
    onlySurvey: number,
    invalid: number,
    privacyFormFileName: string,
    surveyFileName: string,
    outputDirectoryName: string,
  },
};
const JobResultDialog: React.FC<JobResultDialogProps> = ({ isOpen, setIsOpen, resultData }) => {
  if (!resultData) return null;
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className={cn("rounded-lg")}>
        <AlertDialogHeader>
          <AlertDialogTitle>Job Execution Report ({resultData.timestamp})</AlertDialogTitle>
          <AlertDialogDescription className={cn("mb-2 font-bold")}>All operations completed successfully.</AlertDialogDescription>
          <AlertDialogDescription className={cn("mb-2")}>Read input from <span className={cn("font-mono text-xs")}>`{resultData.privacyFormFileName}`</span> and <span className={cn("font-mono text-xs")}>`{resultData.surveyFileName}`</span>.</AlertDialogDescription>
          <AlertDialogDescription className={cn("mb-2")}>
            Processed a total of {resultData.totalStudyCodes} study codes in {resultData.totalEntries} entries ({resultData.totalDuplicates} duplicates):
            <li>{resultData.valid} valid and usable</li>
            <li>{resultData.noConsent} without consent to use of data</li>
            <li>{resultData.onlyPrivacyForm} only in privacy form (no entries found in survey data)</li>
            <li>{resultData.onlySurvey} only in survey (no entries found privacy form data)</li>
            <li>{resultData.invalid} invalid</li>
          </AlertDialogDescription>
        <AlertDialogDescription className={cn("mb-2")}>Output files written to <span className={cn("font-mono text-xs")}>`{resultData.outputDirectoryName}`</span>.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
          }}>Copy to clipboard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const App = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resultData, setResultData] = useState<JobResultDialogProps["resultData"]>(null);
  const onSubmit = useCallback(async (data: JobForm) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setResultData({
      timestamp: new Date().toISOString(),
      totalStudyCodes: 511,
      totalEntries: 934,
      totalDuplicates: 102,
      valid: 384,
      invalid: 28,
      noConsent: 49,
      onlyPrivacyForm: 40,
      onlySurvey: 10,
      privacyFormFileName: 'Datenschutz.csv',
      surveyFileName: 'Umfrage.csv',
      outputDirectoryName: 'citrus-toolbox',
    });
    setIsDialogOpen(true);
    console.log(data)
  }, [setIsDialogOpen, setResultData]);
  return (
    <main className={cn("p-5")}>
      <h1 className={cn("font-black text-center text-4xl mb-10")}>Consent Matcher</h1>
      <JobForm onSubmit={onSubmit} />
      <JobResultDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} resultData={resultData} />
    </main>
  );
};
