import { Headers } from '@/lib/schemas';
import { createJobArgFromCsv, getHeadersFromCsv, writeJobResultToCsv } from './csv';
import { TInternal_JobStats, executeJob } from './core';
import { IOSelection } from '@/components/ps-matcher/IOSelectionForm';
import { HeaderSelection } from '@/components/ps-matcher/HeaderSelectionForm';

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
): Promise<TInternal_JobStats> {
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
    replaceNewlines: info.replaceNewlines,
  });

  return result.stats;
}
