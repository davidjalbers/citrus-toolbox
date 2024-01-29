import path from "path";
import fs from 'fs';
import * as csv from 'fast-csv';
import { CsvParserStream, ParserRow, CsvFormatterStream, FormatterRow } from "fast-csv";

import { AllStudyCodesOutputFileEntry, ColumnDefinition, InputSelection, InputSelectionResult, JobResult, StudyCode, StudyCodeResult } from '@/lib/schemas';
import { getHeadersFromCsvStream, readPrivacyFormFileIntoMap, readSurveyFileIntoMap } from "./input";
import { writeAllStudyCodesFile, writeCommentedFile, writeValidStudyCodesFile } from "./output";

export type JobMap = Map<StudyCode, StudyCodeResult>;
export type CsvInputStream = CsvParserStream<ParserRow, ParserRow>;
export type CsvOutputStream = CsvFormatterStream<FormatterRow, FormatterRow>;

export async function processInputSelectionImpl(info: InputSelection): Promise<InputSelectionResult> {
  const rsPrivacyForm = fs.createReadStream(info.privacyFormFilePath);
  const csvPrivacyForm: CsvInputStream = rsPrivacyForm.pipe(csv.parse({ headers: true, delimiter: info.separator }));
  const privacyFormFileHeaders = await getHeadersFromCsvStream(csvPrivacyForm);
  rsPrivacyForm.close();
  csvPrivacyForm.destroy();
  const rsSurvey = fs.createReadStream(info.surveyFilePath);
  const csvSurvey: CsvInputStream = rsSurvey.pipe(csv.parse({ headers: true, delimiter: info.separator }));
  const surveyFileHeaders = await getHeadersFromCsvStream(csvSurvey);
  rsSurvey.close();
  csvSurvey.destroy();
  return { privacyFormFileHeaders, surveyFileHeaders };
}

function computeStatus(map: JobMap, stats?: JobResult) {
  map.forEach((result, studyCode) => {
    const { consent, indicesInPrivacyForm, indicesInSurvey } = result;
    let status: AllStudyCodesOutputFileEntry['status']
    if (indicesInPrivacyForm.length > 0 && indicesInSurvey.length > 0) {
      if (consent) {
        status = 'okValid';
        if (stats) stats.valid++;
      } else {
        status = 'errorNoConsent';
        if (stats) stats.noConsent++;
      }
    } else if (indicesInPrivacyForm.length > 0) {
      status = 'errorOnlyPrivacyForm';
      if (stats) stats.onlyPrivacyForm++;
    } else if (indicesInSurvey.length > 0) {
      status = 'errorOnlySurvey';
      if (stats) stats.onlySurvey++;
    } else {
      status = 'INVALID';
      if (stats) stats.invalid++;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    map.get(studyCode)!.status = status;
  });
}

export async function processColumnDefinitionAndRunJobImpl(info: InputSelection & ColumnDefinition): Promise<JobResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const privacyFormHeadersFn = (headers: string[]) => {
    if (!headers.includes(info.privacyFormStudyCodeColumn)) throw new Error(`Column ${info.privacyFormStudyCodeColumn} not found in privacy form file`);
    if (!headers.includes(info.privacyFormConsentColumn)) throw new Error(`Column ${info.privacyFormConsentColumn} not found in privacy form file`);
    return headers.map(header => {
      if (header === info.privacyFormIndexColumn) return 'index';
      if (header === info.privacyFormStudyCodeColumn) return 'studyCode';
      if (header === info.privacyFormConsentColumn) return 'consent';
      return header;
    });
  }

  const surveyHeadersFn = (headers: string[]) => {
    if (!headers.includes(info.surveyStudyCodeColumn)) throw new Error(`Column ${info.surveyStudyCodeColumn} not found in survey file`);
    return headers.map(header => {
      if (header === info.surveyIndexColumn) return 'index';
      if (header === info.surveyStudyCodeColumn) return 'studyCode';
      return header;
    });
  }

  const map: JobMap = new Map();
  const stats: JobResult = {
    timestamp: new Date().toISOString(),
    totalStudyCodes: 0,
    totalEntries: 0,
    totalDuplicates: 0,
    valid: 0,
    noConsent: 0,
    onlyPrivacyForm: 0,
    onlySurvey: 0,
    invalid: 0,
    privacyFormFileName: path.basename(info.privacyFormFilePath),
    surveyFileName: path.basename(info.surveyFilePath),
    outputDirectoryName: path.basename(info.outputDirectoryPath),
  };

  const rsPrivacyForm = fs.createReadStream(info.privacyFormFilePath);
  const rsSurvey = fs.createReadStream(info.surveyFilePath);
  const csvPrivacyForm1: CsvInputStream = rsPrivacyForm.pipe(csv.parse({ headers: privacyFormHeadersFn, delimiter: info.separator }));
  const csvSurvey1: CsvInputStream = rsSurvey.pipe(csv.parse({ headers: surveyHeadersFn, delimiter: info.separator }));
  const csvPrivacyForm2: CsvInputStream = rsPrivacyForm.pipe(csv.parse({ headers: privacyFormHeadersFn, delimiter: info.separator }));
  const csvSurvey2: CsvInputStream = rsSurvey.pipe(csv.parse({ headers: surveyHeadersFn, delimiter: info.separator }));

  await readPrivacyFormFileIntoMap(map, csvPrivacyForm1, stats);
  await readSurveyFileIntoMap(map, csvSurvey1, stats);

  rsPrivacyForm.close();
  rsSurvey.close();
  csvPrivacyForm1.destroy();
  csvSurvey1.destroy();
  
  computeStatus(map, stats);

  //console.log('Study Codes:');
  //console.log(map);

  const csvAllStudyCodes: CsvOutputStream = csv.format({ headers: true, delimiter: info.separator });
  const csvValidStudyCodes: CsvOutputStream = csv.format({ headers: true, delimiter: info.separator });
  const csvCommentedPrivacyForm: CsvOutputStream = csv.format({ headers: true, delimiter: info.separator });
  const csvCommentedSurvey: CsvOutputStream = csv.format({ headers: true, delimiter: info.separator });
  const wsAllStudyCodes = csvAllStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_all.csv')));
  const wsValidStudyCodes = csvValidStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_valid.csv')));
  const wsCommentedPrivacyForm = csvCommentedPrivacyForm.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.privacyFormFilePath, '.csv')}_commented.csv`)));
  const wsCommentedSurvey = csvCommentedSurvey.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.surveyFilePath, '.csv')}_commented.csv`)));
  
  await Promise.allSettled([
    writeAllStudyCodesFile(map, csvAllStudyCodes),
    writeValidStudyCodesFile(map, csvValidStudyCodes),
    writeCommentedFile(map, csvPrivacyForm2, csvCommentedPrivacyForm),
    writeCommentedFile(map, csvSurvey2, csvCommentedSurvey),
  ]);

  csvPrivacyForm2.destroy();
  csvSurvey2.destroy();
  csvAllStudyCodes.destroy();
  csvValidStudyCodes.destroy();
  csvCommentedPrivacyForm.destroy();
  csvCommentedSurvey.destroy();
  wsAllStudyCodes.close();
  wsValidStudyCodes.close();
  wsCommentedPrivacyForm.close();
  wsCommentedSurvey.close();

  return stats;
}
