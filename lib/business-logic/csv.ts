import fs from 'fs';
import path from 'path';

import {
  TInternal_JobResult,
  TInternal_JobArg,
  SInternal_JobArg,
  TInput_PrivacyFormEntry,
  SInput_PrivacyFormEntry,
  TInput_SurveyEntry,
  SInput_SurveyEntry,
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
}): Promise<TInternal_JobArg> {
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
  const privacyFormEntries: TInput_PrivacyFormEntry[] = privacyFormRecords
    .map(record => {
      return SInput_PrivacyFormEntry.parse({
        ...record,
        // @ts-expect-error - if the record doesn't have consent, the zod validation will fail anyway
        consent: privacyFormConsentTransformer(record.consent),
      });
    })
    .filter(entry => entry.identifier !== '');
  const surveyContent = fs.readFileSync(surveyFilePath, 'utf-8');
  const surveyRecords: object[] = parse(surveyContent, {
    bom: true,
    delimiter: separator,
    columns: surveyHeaderTransformer,
  });
  const surveyEntries: TInput_SurveyEntry[] = surveyRecords
    .map(record => SInput_SurveyEntry.parse(record))
    .filter(entry => entry.identifier !== '');
  return SInternal_JobArg.parse({ privacyFormEntries, surveyEntries });
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
  result: TInternal_JobResult;
  outputDirectoryPath: string;
  privacyFormFilePath: string;
  surveyFilePath: string;
  replaceNewlines: boolean;
}): Promise<void> {
  const { result, outputDirectoryPath, privacyFormFilePath, surveyFilePath, replaceNewlines } = arg;

  let outputEntries = result.uniqueEntries.map(({ passthrough, ...entry }) => ({
    ...entry,
    statusVisualization: statusVisualization[entry.status],
    numberOfDuplicatesInPrivacyForm: getNumberOfDuplicates(entry.indicesInPrivacyForm),
    numberOfDuplicatesInSurvey: getNumberOfDuplicates(entry.indicesInSurvey),
    ...passthrough,
  }));
  outputEntries = outputEntries.map(replaceBooleansWithFriendlyStrings);
  if (replaceNewlines) {
    outputEntries = outputEntries.map(replaceNewlinesWithSlashes);
  }
  const allOutput = stringify(outputEntries, { header: true });
  const validOutput = stringify(
    outputEntries.filter(entry => entry.status === 'OK_VALID'),
    { header: true },
  );

  let outputEntriesPrivacyForm = result.privacyFormEntries;
  outputEntriesPrivacyForm = outputEntriesPrivacyForm.map(replaceBooleansWithFriendlyStrings);
  if (replaceNewlines) {
    outputEntriesPrivacyForm = outputEntriesPrivacyForm.map(replaceNewlinesWithSlashes);
  }
  const privacyFormOutput = stringify(outputEntriesPrivacyForm, { header: true });
  let outputEntriesSurvey = result.surveyEntries;
  outputEntriesSurvey = outputEntriesSurvey.map(replaceBooleansWithFriendlyStrings);
  if (replaceNewlines) {
    outputEntriesSurvey = outputEntriesSurvey.map(replaceNewlinesWithSlashes);
  }
  const surveyOutput = stringify(outputEntriesSurvey, { header: true });

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

export function replaceNewlinesWithSlashes<T extends Record<string, unknown>>(obj: T): T {
  const newObj = {} as T;
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      newObj[key as keyof T] = value.replace(/\n/g, ' / ') as T[keyof T];
    } else {
      newObj[key as keyof T] = value as T[keyof T];
    }
  }
  return newObj;
}

export function replaceBooleansWithFriendlyStrings<T extends Record<string, unknown>>(obj: T): T {
  const newObj = {} as T;
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'boolean') {
      newObj[key as keyof T] = value.toString() as T[keyof T];
    } else {
      newObj[key as keyof T] = value as T[keyof T];
    }
  }
  return newObj;
}
