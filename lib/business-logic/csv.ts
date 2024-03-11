import fs from 'fs';
import path from 'path';
import * as csv from 'fast-csv';
import {
  JobResult,
  JobArg,
  JobArgSchema,
  PrivacyFormEntry,
  PrivacyFormEntrySchema,
  SurveyEntry,
  SurveyEntrySchema,
  Status,
} from './core';

export async function getHeadersFromCsv(arg: { filePath: string; separator: string }) {
  const { filePath, separator } = arg;
  const readStream = fs.createReadStream(filePath);
  const csvStream = readStream.pipe(csv.parse({ headers: true, delimiter: separator }));
  const headers = await new Promise<string[]>((resolve, reject) => {
    csvStream
      .on('error', error => reject(error))
      .on('headers', data => resolve(data))
      .on('data', () => {
        return;
      })
      .on('data-invalid', () => reject(new Error('Received event "data-invalid"')))
      .on('end', () => reject(new Error('Received event "end" before "headers"')));
  });
  readStream.close();
  csvStream.destroy();
  return headers;
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
  const privacyFormHeaderTransformer: csv.ParserHeaderTransformFunction = headers => {
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
  const surveyHeaderTransformer: csv.ParserHeaderTransformFunction = headers => {
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

  const rsPrivacyForm = fs.createReadStream(privacyFormFilePath);
  const csvPrivacyForm = rsPrivacyForm.pipe(csv.parse({ headers: privacyFormHeaderTransformer, delimiter: separator }));
  const privacyFormEntries: PrivacyFormEntry[] = [];
  await new Promise<void>((resolve, reject) => {
    csvPrivacyForm
      .on('error', error => reject(error))
      .on('data', data => {
        const entry = PrivacyFormEntrySchema.parse({
          ...data,
          consent: privacyFormConsentTransformer(data.consent),
        });
        privacyFormEntries.push(entry);
      })
      .on('data-invalid', () => reject(new Error('Received event "data-invalid"')))
      .on('end', () => resolve());
  });
  csvPrivacyForm.destroy();
  rsPrivacyForm.close();

  const rsSurvey = fs.createReadStream(surveyFilePath);
  const csvSurvey = rsSurvey.pipe(csv.parse({ headers: surveyHeaderTransformer, delimiter: separator }));
  const surveyEntries: SurveyEntry[] = [];
  await new Promise<void>((resolve, reject) => {
    csvSurvey
      .on('error', error => reject(error))
      .on('data', data => {
        const entry = SurveyEntrySchema.parse(data);
        surveyEntries.push(entry);
      })
      .on('data-invalid', () => reject(new Error('Received event "data-invalid"')))
      .on('end', () => resolve());
  });
  csvSurvey.destroy();
  rsSurvey.close();

  return JobArgSchema.parse({ privacyFormEntries, surveyEntries });
}

export async function writeJobResultToCsv(arg: {
  result: JobResult;
  outputDirectoryPath: string;
  privacyFormFilePath: string;
  surveyFilePath: string;
}): Promise<void> {
  const { result, outputDirectoryPath, privacyFormFilePath, surveyFilePath } = arg;

  const csvAllStudyCodes = csv.format({ headers: true });
  const csvValidStudyCodes = csv.format({ headers: true });
  const csvCommentedPrivacyForm = csv.format({ headers: true });
  const csvCommentedSurvey = csv.format({ headers: true });
  const wsAllStudyCodes = csvAllStudyCodes.pipe(
    fs.createWriteStream(path.join(outputDirectoryPath, 'StudyCodes_all.csv')),
  );
  const wsValidStudyCodes = csvValidStudyCodes.pipe(
    fs.createWriteStream(path.join(outputDirectoryPath, 'StudyCodes_valid.csv')),
  );
  const wsCommentedPrivacyForm = csvCommentedPrivacyForm.pipe(
    fs.createWriteStream(path.join(outputDirectoryPath, `${path.basename(privacyFormFilePath, '.csv')}_commented.csv`)),
  );
  const wsCommentedSurvey = csvCommentedSurvey.pipe(
    fs.createWriteStream(path.join(outputDirectoryPath, `${path.basename(surveyFilePath, '.csv')}_commented.csv`)),
  );

  const getStatusVisualization = (status: Status): string => {
    switch (status) {
      case 'OK_VALID':
      case 'ERROR_NO_CONSENT':
        return 'P+S';
      case 'ERROR_ONLY_PRIVACY_FORM':
        return 'P';
      case 'ERROR_ONLY_SURVEY':
        return 'S';
      case 'ERROR_INVALID':
        return '';
    }
  };

  const getNumberOfDuplicates = (indices: number[]) => Math.max(indices.length - 1, 0);

  if (result.uniqueEntries.length !== 0) {
    csvAllStudyCodes.write(Object.keys(result.uniqueEntries[0]));
    csvValidStudyCodes.write(Object.keys(result.uniqueEntries[0]));
  }
  if (result.privacyFormEntries.length !== 0) csvCommentedPrivacyForm.write(Object.keys(result.privacyFormEntries[0]));
  if (result.surveyEntries.length !== 0) csvCommentedSurvey.write(Object.keys(result.surveyEntries[0]));

  result.uniqueEntries.forEach(entry => {
    const { passthrough, ...entryWithoutPassthrough } = entry;
    const entryForOutput = {
      ...entryWithoutPassthrough,
      statusVisualization: getStatusVisualization(entry.status),
      numberOfDuplicatesInPrivacyForm: getNumberOfDuplicates(entry.indicesInPrivacyForm),
      numberOfDuplicatesInSurvey: getNumberOfDuplicates(entry.indicesInSurvey),
      ...passthrough,
    };
    csvAllStudyCodes.write(Object.values(entryForOutput));
    if (entry.status === 'OK_VALID') csvValidStudyCodes.write(Object.values(entryForOutput));
  });
  result.privacyFormEntries.forEach(entry => csvCommentedPrivacyForm.write(Object.values(entry)));
  result.surveyEntries.forEach(entry => csvCommentedSurvey.write(Object.values(entry)));

  csvAllStudyCodes.end();
  csvValidStudyCodes.end();
  csvCommentedPrivacyForm.end();
  csvCommentedSurvey.end();

  await Promise.allSettled([
    () => new Promise<void>(resolve => csvAllStudyCodes.on('finish', () => resolve())),
    () => new Promise<void>(resolve => csvValidStudyCodes.on('finish', () => resolve())),
    () => new Promise<void>(resolve => csvCommentedPrivacyForm.on('finish', () => resolve())),
    () => new Promise<void>(resolve => csvCommentedSurvey.on('finish', () => resolve())),
  ]);

  csvAllStudyCodes.destroy();
  csvValidStudyCodes.destroy();
  csvCommentedPrivacyForm.destroy();
  csvCommentedSurvey.destroy();
  wsAllStudyCodes.close();
  wsValidStudyCodes.close();
  wsCommentedPrivacyForm.close();
  wsCommentedSurvey.close();
}
