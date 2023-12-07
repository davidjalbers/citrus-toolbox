import path from "path";
import fs from 'fs';
import * as csv from 'fast-csv';
import { CsvParserStream, ParserRow, CsvFormatterStream, FormatterRow } from "fast-csv";

import { AllStudyCodesOutputFileEntry, JobInfo, JobResult, PrivacyFormEntry, PrivacyFormEntrySchema, StudyCode, StudyCodeResult, SurveyEntry, SurveyEntrySchema, ValidStudyCodesOutputFileEntry, ValidStudyCodesOutputFileEntrySchema } from '@/lib/schemas';
import { toUpperSnake } from '@/lib/utils';

type JobMap = Map<StudyCode, StudyCodeResult>;
type CsvInputStream = CsvParserStream<ParserRow<any>, ParserRow<any>>;
type CsvOutputStream = CsvFormatterStream<FormatterRow, FormatterRow>;

async function populateMapWithPrivacyFormData(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
  await new Promise<void>(resolve => {
    const isValidConsent = (string: string) => string === 'JA, ich willige ein';
    stream
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = PrivacyFormEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        if (stats) stats.totalEntries++;
        const { index, studyCode, consent }: PrivacyFormEntry = parseResult.data;
        if (!map.has(studyCode)) {
          map.set(studyCode, {
            status: 'INVALID',
            consent: isValidConsent(consent),
            indicesInPrivacyForm: [index],
            indicesInSurvey: [],
            passthrough: {},
          });
          if (stats) stats.totalStudyCodes++;
        } else {
          const result = map.get(studyCode);
          if (!result) return; // should never happen, just for TS (?)
          result.indicesInPrivacyForm.push(index);
          result.consent = isValidConsent(consent); // Assumption: The last entry for a study code is the most recent one and therefore reflects the participant's current consent status
          if (stats) stats.totalDuplicates++;
        }
      })
      .on('end', () => resolve());
  });
}

async function populateMapWithSurveyData(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
  await new Promise<void>(resolve => {
    stream
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = SurveyEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        if (stats) stats.totalEntries++;
        const { index, studyCode, ...passthrough }: SurveyEntry = parseResult.data;
        if (!map.has(studyCode)) {
          map.set(studyCode, {
            status: 'INVALID',
            consent: false,
            indicesInPrivacyForm: [],
            indicesInSurvey: [index],
            passthrough,
          });
          if (stats) stats.totalStudyCodes++;
        } else {
          const result = map.get(studyCode);
          if (!result) return; // should never happen, just for TS (?)
          result.indicesInSurvey.push(index);
          result.passthrough = passthrough; // Assumption: The last entry for a study code is the most recent one and therefore reflects the true passed-through data
          if (stats) stats.totalDuplicates++;
        }
      })
      .on('end', () => resolve());
  });
}

async function computeStatus(map: JobMap, stats?: JobResult) {
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

const postProcessEntryForOutput = (entry: AllStudyCodesOutputFileEntry | ValidStudyCodesOutputFileEntry, passthrough: object) => {
  return { ...Object.fromEntries(Object.entries(entry).map(([key, value]) => {
    if (key === 'status' && typeof value === 'string')
      return ([key, toUpperSnake(value)]);
    return ([key, value]);
  })), ...passthrough }
}

const getIndexVisualizationFromStatus = (status: AllStudyCodesOutputFileEntry['status']): AllStudyCodesOutputFileEntry['indexVisualization'] => {
  switch (status) {
    case 'okValid':
    case 'errorNoConsent': return 'P+S';
    case 'errorOnlyPrivacyForm': return 'P';
    case 'errorOnlySurvey': return 'S';
    case 'INVALID': return 'INVALID';
  }
}

async function writeAllStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
  map.forEach((result, studyCode) => {
    const { status, indicesInPrivacyForm, indicesInSurvey, passthrough } = result;
    const entry: AllStudyCodesOutputFileEntry = { 
      studyCode, 
      status, 
      indexVisualization: getIndexVisualizationFromStatus(status), 
      indicesInPrivacyForm, 
      indicesInSurvey, 
      numberOfDuplicatesInPrivacyForm: Math.max(indicesInPrivacyForm.length - 1, 0),
      numberOfDuplicatesInSurvey: Math.max(indicesInSurvey.length - 1, 0)
    };
    stream.write(postProcessEntryForOutput(entry, passthrough));
  });
}

async function writeValidStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
  map.forEach((result, studyCode) => {
    const { status, indicesInPrivacyForm, indicesInSurvey, passthrough } = result;
    if (status === 'okValid') {
      const entry: ValidStudyCodesOutputFileEntry = { 
        studyCode,
        indicesInPrivacyForm, 
        indicesInSurvey, 
        numberOfDuplicatesInPrivacyForm: Math.max(indicesInPrivacyForm.length - 1, 0),
        numberOfDuplicatesInSurvey: Math.max(indicesInSurvey.length - 1, 0)
      };
      stream.write(postProcessEntryForOutput(entry, passthrough));
    }
  });
}

async function writeCommentedPrivacyFormFile(map: JobMap, inStream: CsvInputStream, outStream: CsvOutputStream) {
  await new Promise<void>(resolve => {
    inStream
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = PrivacyFormEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        const { studyCode, index }: PrivacyFormEntry = parseResult.data;
        const result = map.get(studyCode);
        if (!result) return; // should never happen, just for TS (?)
        const lastOccurrence = result.indicesInPrivacyForm.at(-1);
        outStream.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
      })
      .on('end', () => resolve());
  });
}

async function writeCommentedSurveyFile(map: JobMap, inStream: CsvInputStream, outStream: CsvOutputStream) {
  await new Promise<void>(resolve => {
    inStream
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = SurveyEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        const { studyCode, index }: SurveyEntry = parseResult.data;
        const result = map.get(studyCode);
        if (!result) return; // should never happen, just for TS (?)
        const lastOccurrence = result.indicesInSurvey.at(-1);
        outStream.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
      })
      .on('end', () => resolve());
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

  await populateMapWithPrivacyFormData(map, csvPrivacyForm1, stats);
  await populateMapWithSurveyData(map, csvSurvey1, stats);
  await computeStatus(map, stats);

  console.log('Study Codes:');
  console.log(map);

  const csvAllStudyCodes: CsvOutputStream = csv.format({ headers: true });
  const csvValidStudyCodes: CsvOutputStream = csv.format({ headers: true });
  const csvCommentedPrivacyForm: CsvOutputStream = csv.format({ headers: true });
  const csvCommentedSurvey: CsvOutputStream = csv.format({ headers: true });
  csvAllStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_all.csv')));
  csvValidStudyCodes.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, 'StudyCodes_valid.csv')));
  csvCommentedPrivacyForm.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.privacyFormFilePath, '.csv')}_commented.csv`)));
  csvCommentedSurvey.pipe(fs.createWriteStream(path.join(info.outputDirectoryPath, `${path.basename(info.surveyFilePath, '.csv')}_commented.csv`)));
  
  await Promise.all([
    writeAllStudyCodesFile(map, csvAllStudyCodes),
    writeValidStudyCodesFile(map, csvValidStudyCodes),
    writeCommentedPrivacyFormFile(map, csvPrivacyForm2, csvCommentedPrivacyForm),
    writeCommentedSurveyFile(map, csvSurvey2, csvCommentedSurvey),
  ]);

  return stats;
}
