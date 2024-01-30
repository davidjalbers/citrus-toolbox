import { HeaderSelection, IOSelection, Headers } from '@/lib/schemas';
import { createJobArgFromCsv, getHeadersFromCsv, writeJobResultToCsv } from "./csv";
import { JobResultStats, executeJob } from "./core";


export async function processInputSelectionImpl(info: IOSelection): Promise<Headers> {
  //console.log("processInputSelectionImpl called")
  const privacyFormFileHeaders = await getHeadersFromCsv({ filePath: info.privacyFormFilePath, separator: info.separator });
  const surveyFileHeaders = await getHeadersFromCsv({ filePath: info.surveyFilePath, separator: info.separator });
  return { privacyFormFileHeaders, surveyFileHeaders };
}

export async function processColumnDefinitionAndRunJobImpl(info: IOSelection & HeaderSelection): Promise<JobResultStats> {
  //console.log("processColumnDefinitionAndRunJobImpl called")
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
