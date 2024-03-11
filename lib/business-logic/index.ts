import { Headers } from '@/lib/schemas';
import { createJobArgFromCsv, getHeadersFromCsv, writeJobResultToCsv } from './csv';
import { JobResultStats, executeJob } from './core';
import { IOSelection } from '@/components/ps-matcher/IOSelectionForm';
import { HeaderSelection } from '@/components/ps-matcher/HeaderSelectionForm';
import fs from 'fs';
import path from 'path';

export async function processInputSelectionImpl(info: IOSelection): Promise<Headers> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const privacyFormFileHeaders = await getHeadersFromCsv({
    filePath: info.privacyFormFilePath,
    separator: info.separator,
  });
  const surveyFileHeaders = await getHeadersFromCsv({
    filePath: info.surveyFilePath,
    separator: info.separator,
  });
  return { privacyFormFileHeaders, surveyFileHeaders };
}

export async function processColumnDefinitionAndRunJobImpl(
  info: IOSelection & HeaderSelection,
): Promise<JobResultStats> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const arg = await createJobArgFromCsv({
    ...info,
    privacyFormConsentTransformer: (value: string) => value === info.privacyFormConsentValue,
  });

  const result = executeJob(arg);

  writeJobResultToCsv({
    result,
    privacyFormFilePath: info.privacyFormFilePath,
    surveyFilePath: info.surveyFilePath,
    outputDirectoryPath: info.outputDirectoryPath,
  });

  // Write the entire result object as JSON
  // to the output directory for debugging purposes
  fs.writeFileSync(path.join(info.outputDirectoryPath, 'job_result_object.json'), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(info.outputDirectoryPath, 'job_result_object_no_passthrough.json'),
    JSON.stringify(result, (key, value) => (key === 'passthrough' ? undefined : value), 2),
  );

  return result.stats;
}
