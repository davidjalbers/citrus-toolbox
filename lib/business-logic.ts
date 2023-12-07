import path from "path";
import fs from 'fs';
import * as csv from 'fast-csv';

import { AllStudyCodesOutputFileEntry, JobInfo, JobResult, PrivacyFormEntry, PrivacyFormEntrySchema, StudyCode, StudyCodeResult, SurveyEntry, SurveyEntrySchema, ValidStudyCodesOutputFileEntry, ValidStudyCodesOutputFileEntrySchema } from '@/lib/schemas';
import { toUpperSnake } from '@/lib/utils';

type JobMap = Map<StudyCode, StudyCodeResult>;

async function populateMapWithPrivacyFormData(map: JobMap, stream: ReadableStream, stats?: JobResult) {}
async function populateMapWithSurveyData(map: JobMap, stream: ReadableStream, stats?: JobResult) {}
async function computeStatus(map: JobMap, stats?: JobResult) {}
async function writeAllStudyCodesFile(map: JobMap, stream: WritableStream) {}
async function writeValidStudyCodesFile(map: JobMap, stream: WritableStream) {}
async function writeCommentedPrivacyFormFile(map: JobMap, stream: WritableStream) {}
async function writeCommentedSurveyFile(map: JobMap, stream: WritableStream) {}

export async function runJobImpl2(info: JobInfo) {
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

  // TODO: create input streams from JobInfo

  await populateMapWithPrivacyFormData(map, stream, stats);
  await populateMapWithSurveyData(map, stream, stats);
  await computeStatus(map, stats);

  // TODO: create output streams

  await Promise.all([
    writeAllStudyCodesFile(map, stream),
    writeValidStudyCodesFile(map, stream),
    writeCommentedPrivacyFormFile(map, stream),
    writeCommentedSurveyFile(map, stream),
  ]);
}

export async function runJobImpl(info: JobInfo): Promise<JobResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  /*const commentedPrivacyFormFilePath = path.join(arg.outputDirectoryPath, `${path.basename(arg.privacyFormFilePath, '.csv')}_commented.csv`);
  const consentedParticipants = await getConsentedParticipants(arg.privacyFormFilePath, commentedPrivacyFormFilePath);
  const commentedSurveyFilePath = path.join(arg.outputDirectoryPath, `${path.basename(arg.surveyFilePath, '.csv')}_commented.csv`);
  const filteredSurveyFilePath = path.join(arg.outputDirectoryPath, `${path.basename(arg.surveyFilePath, '.csv')}_filtered.csv`);
  await filterSurveyEntries(arg.surveyFilePath, commentedSurveyFilePath, filteredSurveyFilePath, consentedParticipants);*/

  const jobResult: JobResult = {
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

  const studyCodes = new Map<StudyCode, StudyCodeResult>();

  // First, we read all the data from the privacy form and survey files and store it in a map.
  // Output files are written afterwards because we need to know the final status of each study code.
  
  // read privacy form file
  await new Promise<void>(resolve => {
    const isValidConsent = (string: string) => string === 'JA, ich willige ein';
    fs.createReadStream(info.privacyFormFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = PrivacyFormEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        jobResult.totalEntries++;
        const { index, studyCode, consent }: PrivacyFormEntry = parseResult.data;
        if (!studyCodes.has(studyCode)) {
          studyCodes.set(studyCode, {
            status: 'INVALID',
            consent: isValidConsent(consent),
            indicesInPrivacyForm: [index],
            indicesInSurvey: [],
            passthrough: {},
          });
          jobResult.totalStudyCodes++;
        } else {
          const result = studyCodes.get(studyCode);
          if (!result) return; // should never happen, just for TS (?)
          result.indicesInPrivacyForm.push(index);
          result.consent = isValidConsent(consent); // Assumption: The last entry for a study code is the most recent one and therefore reflects the participant's current consent status
          jobResult.totalDuplicates++;
        }
      })
      .on('end', () => resolve());
  });

  // read survey file
  await new Promise<void>(resolve => {
    fs.createReadStream(info.surveyFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = SurveyEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        jobResult.totalEntries++;
        const { index, studyCode, ...passthrough }: SurveyEntry = parseResult.data;
        if (!studyCodes.has(studyCode)) {
          studyCodes.set(studyCode, {
            status: 'INVALID',
            consent: false,
            indicesInPrivacyForm: [],
            indicesInSurvey: [index],
            passthrough,
          });
          jobResult.totalStudyCodes++;
        } else {
          const result = studyCodes.get(studyCode);
          if (!result) return; // should never happen, just for TS (?)
          result.indicesInSurvey.push(index);
          result.passthrough = passthrough; // Assumption: The last entry for a study code is the most recent one and therefore reflects the true passed-through data
          jobResult.totalDuplicates++;
        }
      })
      .on('end', () => resolve());
  });

  // All data is now gathered. Now we can process it and then write the output files.

  // StudyCodes_all.csv
  const allStudyCodesOutputFilePath = path.join(info.outputDirectoryPath, 'StudyCodes_all.csv');
  const wsAllStudyCodes = fs.createWriteStream(allStudyCodesOutputFilePath);
  const csvAllStudyCodes = csv.format({ headers: true });
  csvAllStudyCodes.pipe(wsAllStudyCodes);

  // StudyCodes_valid.csv
  const validStudyCodesOutputFilePath = path.join(info.outputDirectoryPath, 'StudyCodes_valid.csv');
  const wsValidStudyCodes = fs.createWriteStream(validStudyCodesOutputFilePath);
  const csvValidStudyCodes = csv.format({ headers: true });
  csvValidStudyCodes.pipe(wsValidStudyCodes);

  const postProcessEntryForOutput = (entry: AllStudyCodesOutputFileEntry | ValidStudyCodesOutputFileEntry, passthrough: object) => {
    return { ...Object.fromEntries(Object.entries(entry).map(([key, value]) => {
      if (key === 'status' && typeof value === 'string')
        return ([key, toUpperSnake(value)]);
      return ([key, value]);
    })), ...passthrough }
  }

  studyCodes.forEach((result, studyCode) => {
    const { consent, indicesInPrivacyForm, indicesInSurvey, passthrough } = result;
    let status: AllStudyCodesOutputFileEntry['status']
    let indexVisualization: AllStudyCodesOutputFileEntry['indexVisualization']
    if (indicesInPrivacyForm.length > 0 && indicesInSurvey.length > 0) {
      indexVisualization = 'P+S';
      if (consent) {
        status = 'okValid';
        jobResult.valid++;
      } else {
        status = 'errorNoConsent';
        jobResult.noConsent++;
      }
    } else if (indicesInPrivacyForm.length > 0) {
      status = 'errorOnlyPrivacyForm';
      indexVisualization = 'P';
      jobResult.onlyPrivacyForm++;
    } else if (indicesInSurvey.length > 0) {
      indexVisualization = 'S';
      status = 'errorOnlySurvey';
      jobResult.onlySurvey++;
    } else {
      indexVisualization = 'INVALID';
      status = 'INVALID';
      jobResult.invalid++;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    studyCodes.get(studyCode)!.status = status;
    const allEntry: AllStudyCodesOutputFileEntry = { 
      studyCode, 
      status, 
      indexVisualization, 
      indicesInPrivacyForm, 
      indicesInSurvey, 
      numberOfDuplicatesInPrivacyForm: Math.max(indicesInPrivacyForm.length - 1, 0),
      numberOfDuplicatesInSurvey: Math.max(indicesInSurvey.length - 1, 0)
    };
    csvAllStudyCodes.write(postProcessEntryForOutput(allEntry, passthrough));
    if (status === 'okValid') {
      const validEntry = ValidStudyCodesOutputFileEntrySchema.parse(allEntry);
      csvValidStudyCodes.write(postProcessEntryForOutput(validEntry, passthrough));
    }
  });

  console.log('Study Codes:')
  console.log(studyCodes)

  // PrivacyForm_commented.csv
  const commentedPrivacyFormFilePath = path.join(info.outputDirectoryPath, `${path.basename(info.privacyFormFilePath, '.csv')}_commented.csv`);
  const wsCommentedPrivacyForm = fs.createWriteStream(commentedPrivacyFormFilePath);
  const csvCommentedPrivacyForm = csv.format({ headers: true });
  csvCommentedPrivacyForm.pipe(wsCommentedPrivacyForm);

  await new Promise<void>(resolve => {
    fs.createReadStream(info.privacyFormFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = PrivacyFormEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        const { studyCode, index }: PrivacyFormEntry = parseResult.data;
        const result = studyCodes.get(studyCode);
        if (!result) return; // should never happen, just for TS (?)
        const lastOccurrence = result.indicesInPrivacyForm.at(-1);
        csvCommentedPrivacyForm.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
      })
      .on('end', () => resolve());
  });

  // Survey_commented.csv
  const commentedSurveyFilePath = path.join(info.outputDirectoryPath, `${path.basename(info.surveyFilePath, '.csv')}_commented.csv`);
  const wsCommentedSurvey = fs.createWriteStream(commentedSurveyFilePath);
  const csvCommentedSurvey = csv.format({ headers: true });
  csvCommentedSurvey.pipe(wsCommentedSurvey);

  await new Promise<void>(resolve => {
    fs.createReadStream(info.surveyFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => { return; }) // TODO handle properly
      .on('data-invalid', row => { return; }) // TODO handle properly
      .on('data', row => {
        const parseResult = SurveyEntrySchema.safeParse(row);
        if (!parseResult.success) {
          // TODO handle properly
          return;
        } 
        const { studyCode, index }: SurveyEntry = parseResult.data;
        const result = studyCodes.get(studyCode);
        if (!result) return; // should never happen, just for TS (?)
        const lastOccurrence = result.indicesInSurvey.at(-1);
        csvCommentedSurvey.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
      })
      .on('end', () => resolve());
  });
  
  return jobResult;
}
