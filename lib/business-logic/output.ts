import * as z from 'zod';

import { CsvInputStream, CsvOutputStream, JobMap } from "@/lib/business-logic";
import { readParsedEntriesFromCsvStream } from "@/lib/business-logic/input";
import { AllStudyCodesOutputFileEntry, PrivacyFormEntrySchema, SurveyEntrySchema, ValidStudyCodesOutputFileEntry } from "@/lib/schemas";
import { toUpperSnake } from "@/lib/utils";


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

export function writeAllStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
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

export function writeValidStudyCodesFile(map: JobMap, stream: CsvOutputStream) {
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

export function writeCommentedFile(map: JobMap, inStream: CsvInputStream, outStream: CsvOutputStream) {
  const schema = PrivacyFormEntrySchema.or(SurveyEntrySchema);
  return waitForWriteStream(outStream, () => {
    // TODO remove validation functionality from readParsedEntriesFromCsvStream? Currently using it for writing the commented file results in invalid/unparsable rows being left out.
    return readParsedEntriesFromCsvStream<z.infer<typeof schema>>(inStream, schema, (entry, row) => {
      if (typeof row !== 'object') return; // TODO handle properly (should never happen)
      const { studyCode, index } = entry;
      const result = map.get(studyCode);
      if (!result) return; // should never happen, just for TS (?)
      const lastOccurrence = result.indicesInSurvey.at(-1);
      outStream.write({ ...row, status: toUpperSnake(result.status), mostRecentOccurrence: lastOccurrence == index ? 'THIS' : lastOccurrence });
    });
  });
}
