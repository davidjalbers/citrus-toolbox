import path from "path";

import { JobInfo, JobResult, StudyCode, StudyCodeResult } from "@/lib/schemas";

type JobMap = Map<StudyCode, StudyCodeResult>;

async function populateMapWithPrivacyFormData(map: JobMap, stream: ReadableStream, stats?: JobResult) {}
async function populateMapWithSurveyData(map: JobMap, stream: ReadableStream, stats?: JobResult) {}
async function computeStatus(map: JobMap, stats?: JobResult) {}
async function writeAllStudyCodesFile(map: JobMap, stream: WritableStream) {}
async function writeValidStudyCodesFile(map: JobMap, stream: WritableStream) {}
async function writeCommentedPrivacyFormFile(map: JobMap, stream: WritableStream) {}
async function writeCommentedSurveyFile(map: JobMap, stream: WritableStream) {}

export async function runJobImpl(info: JobInfo) {
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
