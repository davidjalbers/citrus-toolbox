import React, { useCallback, useState } from 'react';

import { JobCreationForm } from '@/components/JobCreationForm';
import { JobResultDialog } from '@/components/JobResultDialog';
import { JobInfo, JobResult } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export const App = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resultData, setResultData] = useState<JobResult|null>(null);
  const runJob = useCallback(async (info: JobInfo) => {
    const result = await electron.runJob(info);
    setResultData(result);
    setIsDialogOpen(true);
  }, [setIsDialogOpen, setResultData]);
  return (
    <main className={cn("p-5")}>
      <h1 className={cn("font-black text-center text-4xl mb-10")}>P+S Matcher</h1>
      <JobCreationForm onSubmit={runJob} />
      <JobResultDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} resultData={resultData} />
    </main>
  );
};
