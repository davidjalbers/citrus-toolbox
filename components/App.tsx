import React, { useCallback, useState } from 'react';

import { JobCreationForm } from '@/components/JobCreationForm';
import { JobResultDialog } from '@/components/JobResultDialog';
import { JobResult } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export const App = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resultData, setResultData] = useState<JobResult|null>(null);
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
