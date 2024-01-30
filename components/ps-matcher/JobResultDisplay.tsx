import React from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { JobResultStats } from "@/lib/business-logic/core";

type JobResultDialogProps = {
  stats: JobResultStats,
};
export const JobResultDialog: React.FC<JobResultDialogProps> = ({ stats }) => {
  if (!stats) return null;
  return (
    <>
      <CardHeader>
        <CardTitle>Job Execution Report{/*  ({stats.timestamp}) */}</CardTitle>
      </CardHeader>
      <CardContent>
          <CardDescription className={cn("mb-2 font-bold text-green-600")}>All operations completed successfully.</CardDescription>
          {/* <CardDescription className={cn("mb-2")}>Read input from <span className={cn("font-mono text-xs")}>`{stats.privacyFormFileName}`</span> and <span className={cn("font-mono text-xs")}>`{stats.surveyFileName}`</span>.</CardDescription> */}
          <CardDescription className={cn("mb-2")}>
            Processed a total of {stats.totalUniqueIdentifiers} unique study codes in {stats.totalEntries} entries ({stats.totalDuplicates} duplicates):
            <li>{stats.valid} valid and usable</li>
            <li>{stats.noConsent} without consent to use of data</li>
            <li>{stats.onlyPrivacyForm} only in privacy form (no entries found in survey data)</li>
            <li>{stats.onlySurvey} only in survey (no entries found in privacy form data)</li>
            <li>{stats.invalid} invalid</li>
          </CardDescription>
        {/* <CardDescription className={cn("mb-2")}>Output files written to <span className={cn("font-mono text-xs")}>`{stats.outputDirectoryName}`</span>.</CardDescription> */}
      </CardContent>
      <CardFooter>
        <Button onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(stats, null, 2));
        }}>Copy to clipboard</Button>
      </CardFooter>
    </>
  );
};
