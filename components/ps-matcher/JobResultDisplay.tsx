import React from "react";

import { cn } from "@/lib/utils";
import { CardDescription, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { JobResultStats } from "@/lib/business-logic/core";
import { ViewStepComponent } from "@/hooks/use-multistep-form";
import { IOSelection } from "./IOSelectionForm";
import { HeaderSelection } from "./HeaderSelectionForm";
import { Headers } from "@/lib/schemas";

export const JobResultDisplay: ViewStepComponent<[IOSelection, Headers, HeaderSelection, JobResultStats], void> = ({ data }) => {
  const { outputDirectoryPath, privacyFormFilePath, surveyFilePath } = data[0];
  const { timestamp, totalUniqueIdentifiers, totalEntries, totalDuplicates, valid, noConsent, onlyPrivacyForm, onlySurvey, invalid } = data[3];
  return (
    <>
      <CardTitle className={cn("mb-6")}>Job Execution Report ({timestamp.toISOString()})</CardTitle>
      <CardDescription className={cn("mb-2 font-bold text-green-600")}>All operations completed successfully.</CardDescription>
      <CardDescription className={cn("mb-2")}>Read input from <span className={cn("font-mono text-xs")}>`{privacyFormFilePath}`</span> and <span className={cn("font-mono text-xs")}>`{surveyFilePath}`</span>.</CardDescription>
      <CardDescription className={cn("mb-2")}>
        Processed a total of {totalUniqueIdentifiers} unique study codes in {totalEntries} entries ({totalDuplicates} duplicates):
        <li>{valid} valid and usable</li>
        <li>{noConsent} without consent to use of data</li>
        <li>{onlyPrivacyForm} only in privacy form (no entries found in survey data)</li>
        <li>{onlySurvey} only in survey (no entries found in privacy form data)</li>
        <li>{invalid} invalid</li>
      </CardDescription>
      <CardDescription className={cn("mb-6")}>Output files written to <span className={cn("font-mono text-xs")}>`{outputDirectoryPath}`</span>.</CardDescription>
      <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}>Copy log data to clipboard</Button>
    </>
  );
};
