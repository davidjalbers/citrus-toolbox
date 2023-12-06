import React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { JobInfoSchema } from '@/lib/schemas';

const JobCreationFormSchema = JobInfoSchema.pick({
  privacyFormFilePath: true,
  surveyFilePath: true,
  outputDirectoryPath: true,
});
export type JobCreationForm = z.infer<typeof JobCreationFormSchema>;

type JobCreationFormProps = {
  onSubmit: (data: JobCreationForm) => void | Promise<void>;
};
export const JobCreationForm: React.FC<JobCreationFormProps> = ({ onSubmit }) => {
  const form = useForm<JobCreationForm>({
    resolver: zodResolver(JobCreationFormSchema),
    defaultValues: {
      privacyFormFilePath: import.meta.env.VITE_DEFAULT_PRIVACY_FORM_FILE_PATH || '',
      surveyFilePath: import.meta.env.VITE_DEFAULT_SURVEY_FILE_PATH || '',
      outputDirectoryPath: import.meta.env.VITE_DEFAULT_OUTPUT_DIR_PATH || '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
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
                  <Input {...field} spellCheck={false} placeholder='/path/to/privacy.csv'/>
                  <Button type="button" onClick={async () => {
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
                <div className={cn("flex gap-1")}>
                  <Input {...field} spellCheck={false} placeholder='/path/to/survey.csv'/>
                  <Button type="button" onClick={async () => {
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
        <hr />
        <FormField
          control={form.control}
          name="outputDirectoryPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn("font-bold")}>Output Directory Path</FormLabel>
              <FormControl>
                <div className={cn("flex gap-1")}>
                  <Input {...field} spellCheck={false} placeholder='/path/to/output' />
                  <Button type="button" onClick={async () => {
                    const path = await electron.selectPath({ type: 'directory' });
                    if (path) form.setValue('outputDirectoryPath', path, { shouldValidate: true });
                  }}>Select directory</Button>
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
};
