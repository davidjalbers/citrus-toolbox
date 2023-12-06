import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { JobResult } from "@/lib/schemas";

type JobResultDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resultData: JobResult | null,
};
export const JobResultDialog: React.FC<JobResultDialogProps> = ({ isOpen, setIsOpen, resultData }) => {
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
            <li>{resultData.onlySurvey} only in survey (no entries found in privacy form data)</li>
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
