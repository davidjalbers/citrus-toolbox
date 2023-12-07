import { ZodSchema } from "zod";

import { CsvInputStream, JobMap } from "@/lib/business-logic";
import { JobResult, PrivacyFormEntry, PrivacyFormEntrySchema, SurveyEntry, SurveyEntrySchema } from "@/lib/schemas";


export function readParsedEntriesFromCsvStream<T>(stream: CsvInputStream, schema: ZodSchema, callback: (entry: T, row: unknown) => void) {
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

export function readPrivacyFormFileIntoMap(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
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

export function readSurveyFileIntoMap(map: JobMap, stream: CsvInputStream, stats?: JobResult) {
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