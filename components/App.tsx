import React, { useCallback, useState } from 'react';

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
import { JobCreationForm } from '@/components/JobCreationForm';
import { cn } from '@/lib/utils';

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
          <AlertDialogDescription className={cn("mb-2 font-bold text-green-600")}>All operations completed successfully.</AlertDialogDescription>
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
  const runJob = useCallback(async (data: JobCreationForm) => {
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
      <JobCreationForm onSubmit={runJob} />
      <JobResultDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} resultData={resultData} />
    </main>
  );
};
