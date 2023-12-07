import path from "path";
import fs from 'fs';
import * as csv from 'fast-csv';
import { CsvParserStream, ParserRow, CsvFormatterStream, FormatterRow } from "fast-csv";

import { AllStudyCodesOutputFileEntry, JobInfo, JobResult, StudyCode, StudyCodeResult } from '@/lib/schemas';
import { readPrivacyFormFileIntoMap, readSurveyFileIntoMap } from "./input";
import { writeAllStudyCodesFile, writeCommentedFile, writeValidStudyCodesFile } from "./output";

export type JobMap = Map<StudyCode, StudyCodeResult>;
export type CsvInputStream = CsvParserStream<ParserRow, ParserRow>;
export type CsvOutputStream = CsvFormatterStream<FormatterRow, FormatterRow>;

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

export async function runJobImpl(info: JobInfo) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

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
  const csvPrivacyForm1: CsvInputStream = rsPrivacyForm.pipe(csv.parse({ headers: true }));
  const csvSurvey1: CsvInputStream = rsSurvey.pipe(csv.parse({ headers: true }));
  const csvPrivacyForm2: CsvInputStream = rsPrivacyForm.pipe(csv.parse({ headers: true }));
  const csvSurvey2: CsvInputStream = rsSurvey.pipe(csv.parse({ headers: true }));

  await readPrivacyFormFileIntoMap(map, csvPrivacyForm1, stats);
  await readSurveyFileIntoMap(map, csvSurvey1, stats);
  
  computeStatus(map, stats);

  //console.log('Study Codes:');
  //console.log(map);

  const csvAllStudyCodes: CsvOutputStream = csv.format({ headers: true });
  const csvValidStudyCodes: CsvOutputStream = csv.format({ headers: true });
  const csvCommentedPrivacyForm: CsvOutputStream = csv.format({ headers: true });
  const csvCommentedSurvey: CsvOutputStream = csv.format({ headers: true });
  csvAllStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_all.csv')));
  csvValidStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_valid.csv')));
  csvCommentedPrivacyForm.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.privacyFormFilePath, '.csv')}_commented.csv`)));
  csvCommentedSurvey.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.surveyFilePath, '.csv')}_commented.csv`)));
  
  await Promise.allSettled([
    writeAllStudyCodesFile(map, csvAllStudyCodes),
    writeValidStudyCodesFile(map, csvValidStudyCodes),
    writeCommentedFile(map, csvPrivacyForm2, csvCommentedPrivacyForm),
    writeCommentedFile(map, csvSurvey2, csvCommentedSurvey),
  ]);

  return stats;
}
