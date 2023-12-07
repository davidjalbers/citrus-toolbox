import path from "path";
import fs from 'fs';
import * as csv from 'fast-csv';
import { CsvParserStream, ParserRow, CsvFormatterStream, FormatterRow } from "fast-csv";

import { AllStudyCodesOutputFileEntry, JobInfo, JobResult, PrivacyFormEntry, PrivacyFormEntrySchema, StudyCode, StudyCodeResult, SurveyEntry, SurveyEntrySchema, ValidStudyCodesOutputFileEntry } from '@/lib/schemas';
import { toUpperSnake } from '@/lib/utils';
import { ZodSchema, z } from "zod";

type JobMap = Map<StudyCode, StudyCodeResult>;
type CsvInputStream = CsvParserStream<ParserRow, ParserRow>;
type CsvOutputStream = CsvFormatterStream<FormatterRow, FormatterRow>;

function readParsedEntriesFromCsvStream<T>(stream: CsvInputStream, schema: ZodSchema, callback: (entry: T, row: any) => void) {
  return new Promise<void>(resolve => {
    stream
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = schema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        callback(parseResult.data, row);
      })
      .on('end', () => resolve());
  });
}

function populateMapWithPrivacyFormData(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
  const isValidConsent = (string: string) => string === 'JA, ich willige ein';
  return readParsedEntriesFromCsvStream<PrivacyFormEntry>(stream, PrivacyFormEntrySchema, entry => {
    if (stats) stats.totalEntries++;
    const { index, studyCode, consent } = entry;
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
  });
}

function populateMapWithSurveyData(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
  return readParsedEntriesFromCsvStream<SurveyEntry>(stream, SurveyEntrySchema, entry => {
    if (stats) stats.totalEntries++;
    const { index, studyCode, ...passthrough } = entry;
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
  });
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

const getPostProcessedEntryForOutput = (entry: AllStudyCodesOutputFileEntry | ValidStudyCodesOutputFileEntry, passthrough: object) => {
  return { ...Object.fromEntries(Object.entries(entry).map(([key, value]) => {
    if (key === 'status' && typeof value === 'string')
      return ([key, toUpperSnake(value)]);
    return ([key, value]);
  })), ...passthrough }
};

const getIndexVisualizationFromStatus = (status: AllStudyCodesOutputFileEntry['status']): AllStudyCodesOutputFileEntry['indexVisualization'] => {
  switch (status) {
    case 'okValid':
    case 'errorNoConsent': return 'P+S';
    case 'errorOnlyPrivacyForm': return 'P';
    case 'errorOnlySurvey': return 'S';
    case 'INVALID': return 'INVALID';
  }
};

const getNumberOfDuplicates = (indices: number[]) => Math.max(indices.length - 1, 0);

function waitForWriteStream(stream: CsvOutputStream, callback: () => void | Promise<void>) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    await callback();
    stream.end();
    stream.on('finish', () => resolve());
  });
}

function writeAllStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
  return waitForWriteStream(stream, () => {
    map.forEach((result, studyCode) => {
      const { status, indicesInPrivacyForm, indicesInSurvey, passthrough } = result;
      const entry: AllStudyCodesOutputFileEntry = { 
        studyCode, 
        status, 
        indexVisualization: getIndexVisualizationFromStatus(status), 
        indicesInPrivacyForm, 
        indicesInSurvey, 
        numberOfDuplicatesInPrivacyForm: getNumberOfDuplicates(indicesInPrivacyForm),
        numberOfDuplicatesInSurvey: getNumberOfDuplicates(indicesInSurvey),
      };
      stream.write(getPostProcessedEntryForOutput(entry, passthrough));
    });
  })
}

function writeValidStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
  return waitForWriteStream(stream, () => {
    map.forEach((result, studyCode) => {
      const { status, indicesInPrivacyForm, indicesInSurvey, passthrough } = result;
      if (status === 'okValid') {
        const entry: ValidStudyCodesOutputFileEntry = { 
          studyCode,
          indicesInPrivacyForm, 
          indicesInSurvey, 
          numberOfDuplicatesInPrivacyForm: getNumberOfDuplicates(indicesInPrivacyForm),
          numberOfDuplicatesInSurvey: getNumberOfDuplicates(indicesInSurvey),
        };
        stream.write(getPostProcessedEntryForOutput(entry, passthrough));
      }
    });
  });
}

function writeCommentedFile(map: JobMap, inStream: CsvInputStream, outStream: CsvOutputStream) {
  const schema = PrivacyFormEntrySchema.or(SurveyEntrySchema);
  return new Promise<void>(resolve => {
    readParsedEntriesFromCsvStream<z.infer<typeof schema>>(inStream, schema, (entry, row) => {
      const { studyCode, index } = entry;
      const result = map.get(studyCode);
      if (!result) return; // should never happen, just for TS (?)
      const lastOccurrence = result.indicesInSurvey.at(-1);
      outStream.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
    }).then(() => {
      outStream.end();
      outStream.on('finish', () => resolve());
    });
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
