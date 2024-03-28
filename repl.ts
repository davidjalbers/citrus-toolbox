import { executeJob } from './lib/business-logic/core';
import { createJobArgFromCsv, writeJobResultToCsv } from './lib/business-logic/csv';

const privacyFormFilePath = 'Datenschutz.csv';
const surveyFilePath = 'Umfrage.csv';
const outputDirectoryPath = '.';

const run = async () => {
  const arg = await createJobArgFromCsv({
    privacyFormFilePath,
    privacyFormIdentifierHeader: '26',
    privacyFormConsentHeader: '27',
    privacyFormConsentTransformer: value => value === 'JA, ich willige ein',
    surveyFilePath,
    surveyIdentifierHeader: '8',
    separator: ',',
  });

  const result = await executeJob(arg);

  await writeJobResultToCsv({
    result,
    outputDirectoryPath,
    privacyFormFilePath,
    surveyFilePath,
    replaceNewlines: true,
  });

  console.log(result.stats);
};

run();
