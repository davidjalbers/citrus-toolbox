import { Headers } from '@/lib/schemas';
import { createJobArgFromCsv, getHeadersFromCsv, writeJobResultToCsv } from "./csv";
import { JobResultStats, executeJob } from "./core";
import { IOSelection } from '@/components/ps-matcher/IOSelectionForm';
import { HeaderSelection } from '@/components/ps-matcher/HeaderSelectionForm';


export async function processInputSelectionImpl(info: IOSelection): Promise<Headers> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const privacyFormFileHeaders = await getHeadersFromCsv({ filePath: info.privacyFormFilePath, separator: info.separator });
  const surveyFileHeaders = await getHeadersFromCsv({ filePath: info.surveyFilePath, separator: info.separator });
  return { privacyFormFileHeaders, surveyFileHeaders };
}

export async function processColumnDefinitionAndRunJobImpl(info: IOSelection & HeaderSelection): Promise<JobResultStats> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const arg = await createJobArgFromCsv({
    ...info,
    privacyFormConsentTransformer: (value: string) => value === 'JA, ich willige ein',
  });

  const result = executeJob(arg);

  writeJobResultToCsv({
    result,
    privacyFormFilePath: info.privacyFormFilePath,
    surveyFilePath: info.surveyFilePath,
    outputDirectoryPath: info.outputDirectoryPath,
  })

  return result.stats;
}
