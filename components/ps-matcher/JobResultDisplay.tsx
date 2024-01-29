import React from "react";

import { cn } from "@/lib/utils";
import { JobResult } from "@/lib/schemas";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

type JobResultDialogProps = {
  result: JobResult,
};
export const JobResultDialog: React.FC<JobResultDialogProps> = ({ result: resultData }) => {
  if (!resultData) return null;
  return (
    <>
      <CardHeader>
        <CardTitle>Job Execution Report ({resultData.timestamp})</CardTitle>
      </CardHeader>
      <CardContent>
          <CardDescription className={cn("mb-2 font-bold text-green-600")}>All operations completed successfully.</CardDescription>
          <CardDescription className={cn("mb-2")}>Read input from <span className={cn("font-mono text-xs")}>`{resultData.privacyFormFileName}`</span> and <span className={cn("font-mono text-xs")}>`{resultData.surveyFileName}`</span>.</CardDescription>
          <CardDescription className={cn("mb-2")}>
            Processed a total of {resultData.totalStudyCodes} study codes in {resultData.totalEntries} entries ({resultData.totalDuplicates} duplicates):
            <li>{resultData.valid} valid and usable</li>
            <li>{resultData.noConsent} without consent to use of data</li>
            <li>{resultData.onlyPrivacyForm} only in privacy form (no entries found in survey data)</li>
            <li>{resultData.onlySurvey} only in survey (no entries found in privacy form data)</li>
            <li>{resultData.invalid} invalid</li>
          </CardDescription>
        <CardDescription className={cn("mb-2")}>Output files written to <span className={cn("font-mono text-xs")}>`{resultData.outputDirectoryName}`</span>.</CardDescription>
      </CardContent>
      <CardFooter>
        <Button onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
        }}>Copy to clipboard</Button>
      </CardFooter>
    </>
  );
};
