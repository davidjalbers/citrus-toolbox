import fs from 'fs';
import path from 'path';

import {
  JobResult,
  JobArg,
  JobArgSchema,
  PrivacyFormEntry,
  PrivacyFormEntrySchema,
  SurveyEntry,
  SurveyEntrySchema,
} from './core';

import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

export async function getHeadersFromCsv(arg: { filePath: string; separator: string }): Promise<string[]> {
  const { filePath, separator } = arg;
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { bom: true, delimiter: separator });
  if (records.length === 0) throw new Error('No records found during header scan');
  return records[0];
}

export async function createJobArgFromCsv(arg: {
  privacyFormFilePath: string;
  privacyFormIdentifierHeader: string;
  privacyFormConsentHeader: string;
  privacyFormConsentTransformer: (value: string) => boolean;
  surveyFilePath: string;
  surveyIdentifierHeader: string;
  separator: string;
}): Promise<JobArg> {
  const {
    privacyFormFilePath,
    privacyFormIdentifierHeader,
    privacyFormConsentHeader,
    privacyFormConsentTransformer,
    surveyFilePath,
    surveyIdentifierHeader,
    separator,
  } = arg;
  const privacyFormHeaderTransformer = (headers: string[]) => {
    const idxPrivacyFormIdentifierHeader = parseInt(privacyFormIdentifierHeader, 10);
    if (
      idxPrivacyFormIdentifierHeader < 0 ||
      idxPrivacyFormIdentifierHeader >= headers.length ||
      isNaN(idxPrivacyFormIdentifierHeader)
    )
      throw new Error(`Column with index "${privacyFormIdentifierHeader}" not found in privacy form file`);
    const idxPrivacyFormConsentHeader = parseInt(privacyFormConsentHeader, 10);
    if (
      idxPrivacyFormConsentHeader < 0 ||
      idxPrivacyFormConsentHeader >= headers.length ||
      isNaN(idxPrivacyFormConsentHeader)
    )
      throw new Error(`Column with index "${privacyFormConsentHeader}" not found in privacy form file`);
    return headers.map((header, idx) => {
      if (idx == idxPrivacyFormIdentifierHeader) return 'identifier';
      if (idx == idxPrivacyFormConsentHeader) return 'consent';
      return header;
    });
  };
  const surveyHeaderTransformer = (headers: string[]) => {
    const idxSurveyIdentifierHeader = parseInt(surveyIdentifierHeader, 10);
    if (
      idxSurveyIdentifierHeader < 0 ||
      idxSurveyIdentifierHeader >= headers.length ||
      isNaN(idxSurveyIdentifierHeader)
    )
      throw new Error(`Column with index "${surveyIdentifierHeader}" not found in survey file`);
    return headers.map((header, idx) => {
      if (idx == idxSurveyIdentifierHeader) return 'identifier';
      return header;
    });
  };

  const privacyFormContent = fs.readFileSync(privacyFormFilePath, 'utf-8');
  const privacyFormRecords: object[] = parse(privacyFormContent, {
    bom: true,
    delimiter: separator,
    columns: privacyFormHeaderTransformer,
  });
  const privacyFormEntries: PrivacyFormEntry[] = privacyFormRecords.map(record => {
    return PrivacyFormEntrySchema.parse({
      ...record,
      // @ts-expect-error - if the record doesn't have consent, the zod validation will fail anyway
      consent: privacyFormConsentTransformer(record.consent),
    });
  });

  const surveyContent = fs.readFileSync(surveyFilePath, 'utf-8');
  const surveyRecords: object[] = parse(surveyContent, {
    bom: true,
    delimiter: separator,
    columns: surveyHeaderTransformer,
  });
  const surveyEntries: SurveyEntry[] = surveyRecords.map(record => SurveyEntrySchema.parse(record));

  return JobArgSchema.parse({ privacyFormEntries, surveyEntries });
}

const statusVisualization = {
  OK_VALID: 'P+S',
  ERROR_NO_CONSENT: 'P+S',
  ERROR_ONLY_PRIVACY_FORM: 'P',
  ERROR_ONLY_SURVEY: 'S',
  ERROR_INVALID: '',
};

const getNumberOfDuplicates = (indices: number[]) => Math.max(indices.length - 1, 0);

export async function writeJobResultToCsv(arg: {
  result: JobResult;
  outputDirectoryPath: string;
  privacyFormFilePath: string;
  surveyFilePath: string;
}): Promise<void> {
  const { result, outputDirectoryPath, privacyFormFilePath, surveyFilePath } = arg;

  const outputEntries = result.uniqueEntries.map(({ passthrough, ...entry }) => ({
    ...entry,
    statusVisualization: statusVisualization[entry.status],
    numberOfDuplicatesInPrivacyForm: getNumberOfDuplicates(entry.indicesInPrivacyForm),
    numberOfDuplicatesInSurvey: getNumberOfDuplicates(entry.indicesInSurvey),
    ...passthrough,
  }));

  const allOutput = stringify(outputEntries, { header: true });
  const validOutput = stringify(
    outputEntries.filter(entry => entry.status === 'OK_VALID'),
    { header: true },
  );
  const privacyFormOutput = stringify(result.privacyFormEntries, { header: true });
  const surveyOutput = stringify(result.surveyEntries, { header: true });
  fs.writeFileSync(path.join(outputDirectoryPath, `StudyCodes_all.csv`), allOutput);
  fs.writeFileSync(path.join(outputDirectoryPath, `StudyCodes_valid.csv`), validOutput);
  fs.writeFileSync(
    path.join(outputDirectoryPath, `${path.basename(privacyFormFilePath, '.csv')}_commented.csv`),
    privacyFormOutput,
  );
  fs.writeFileSync(
    path.join(outputDirectoryPath, `${path.basename(surveyFilePath, '.csv')}_commented.csv`),
    surveyOutput,
  );
}
