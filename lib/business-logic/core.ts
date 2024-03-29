/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as z from 'zod';

export const SInput_PrivacyFormEntry = z
  .object({
    identifier: z.string(),
    consent: z.boolean(),
  })
  .passthrough();
export const SInput_SurveyEntry = z
  .object({
    identifier: z.string(),
  })
  .passthrough();
const SStatus = z.enum([
  'OK_VALID',
  'ERROR_NO_CONSENT',
  'ERROR_ONLY_PRIVACY_FORM',
  'ERROR_ONLY_SURVEY',
  'ERROR_INVALID',
]);
const SOutput_CommentedInputEntry = z.object({
  status: SStatus,
  mostRecentOccurence: z.union([z.literal('this'), z.number()]),
});
const SInternal_UnprocessedEntry = z.object({
  identifier: z.string(),
  consent: z.boolean(),
  indexUsedForConsent: z.number(),
  privacyFormOccurrences: SInput_PrivacyFormEntry.extend({ index: z.number() }).array(),
  surveyOccurrences: SInput_SurveyEntry.extend({
    index: z.number(),
    passthrough: z.record(z.unknown()).optional(),
  }).array(),
});
const SOutput_ResultEntry = z.object({
  identifier: z.string(),
  consent: z.boolean(),
  indexUsedForConsent: z.number(),
  status: SStatus,
  indicesInPrivacyForm: z.array(z.number()),
  indicesInSurvey: z.array(z.number()),
  passthrough: z.record(z.unknown()).optional(),
});
const SInternal_JobStats = z.object({
  timestamp: z.date(),
  totalEntries: z.number(),
  totalUniqueIdentifiers: z.number(),
  totalDuplicates: z.number(),
  valid: z.number(),
  noConsent: z.number(),
  onlyPrivacyForm: z.number(),
  onlySurvey: z.number(),
  invalid: z.number(),
});
const SInternal_JobResult = z.object({
  stats: SInternal_JobStats,
  privacyFormEntries: z.array(SInput_PrivacyFormEntry.merge(SOutput_CommentedInputEntry).passthrough()),
  surveyEntries: z.array(SInput_SurveyEntry.merge(SOutput_CommentedInputEntry).passthrough()),
  uniqueEntries: z.array(SOutput_ResultEntry),
});
export const SInternal_JobArg = z.object({
  privacyFormEntries: z.array(SInput_PrivacyFormEntry),
  surveyEntries: z.array(SInput_SurveyEntry),
});

export type TInput_PrivacyFormEntry = z.infer<typeof SInput_PrivacyFormEntry>;
export type TInput_SurveyEntry = z.infer<typeof SInput_SurveyEntry>;
export type TStatus = z.infer<typeof SStatus>;
// type TOutput_ResultEntry = z.infer<typeof SOutput_ResultEntry>;
type TInternal_UnprocessedEntry = z.infer<typeof SInternal_UnprocessedEntry>;
export type TInternal_JobStats = z.infer<typeof SInternal_JobStats>;
export type TInternal_JobResult = z.infer<typeof SInternal_JobResult>;
export type TInternal_JobArg = z.infer<typeof SInternal_JobArg>;

export function executeJob(rawArg: TInternal_JobArg): TInternal_JobResult {
  const arg = SInternal_JobArg.parse(rawArg);
  const result: TInternal_JobResult = {
    stats: {
      timestamp: new Date(),
      totalEntries: 0,
      totalUniqueIdentifiers: 0,
      totalDuplicates: 0,
      valid: 0,
      noConsent: 0,
      onlyPrivacyForm: 0,
      onlySurvey: 0,
      invalid: 0,
    },
    privacyFormEntries: [],
    surveyEntries: [],
    uniqueEntries: [],
  };
  const entries = new Map<string, TInternal_UnprocessedEntry>();
  arg.privacyFormEntries.forEach((newEntry, index) => {
    result.stats.totalEntries++;
    const { identifier, consent } = newEntry;
    if (!entries.has(identifier)) {
      entries.set(identifier, {
        identifier,
        consent,
        indexUsedForConsent: index,
        privacyFormOccurrences: [{ ...newEntry, index }],
        surveyOccurrences: [],
      });
    } else {
      result.stats.totalDuplicates++;
      const existingEntry = entries.get(identifier)!;
      existingEntry.privacyFormOccurrences.push({ ...newEntry, index });
      existingEntry.consent = newEntry.consent; // Assumption: The last entry for a study code is the most recent one and therefore reflects the participant's current consent status, so overwrite
      existingEntry.indexUsedForConsent = index;
    }
  });
  arg.surveyEntries.forEach((newEntry, index) => {
    result.stats.totalEntries++;
    const { identifier, ...passthrough } = newEntry;
    if (!entries.has(identifier)) {
      entries.set(identifier, {
        identifier,
        consent: false,
        indexUsedForConsent: -1,
        privacyFormOccurrences: [],
        surveyOccurrences: [{ ...newEntry, index, passthrough }],
      });
    } else {
      const existingEntry = entries.get(identifier)!;
      if (existingEntry.surveyOccurrences.length != 0) {
        result.stats.totalDuplicates++;
      }
      existingEntry.surveyOccurrences.push({ ...newEntry, index, passthrough });
    }
  });
  result.stats.totalUniqueIdentifiers = entries.size;
  // Compute status
  entries.forEach(entry => {
    const { consent, privacyFormOccurrences, surveyOccurrences } = entry;
    let status: TStatus;
    if (privacyFormOccurrences.length > 0 && surveyOccurrences.length > 0) {
      if (consent) {
        result.stats.valid++;
        status = 'OK_VALID';
      } else {
        result.stats.noConsent++;
        status = 'ERROR_NO_CONSENT';
      }
    } else if (privacyFormOccurrences.length > 0) {
      result.stats.onlyPrivacyForm++;
      status = 'ERROR_ONLY_PRIVACY_FORM';
    } else if (surveyOccurrences.length > 0) {
      result.stats.onlySurvey++;
      status = 'ERROR_ONLY_SURVEY';
    } else {
      result.stats.invalid++;
      status = 'ERROR_INVALID';
    }
    const pushToUniqueEntries = (passthrough: Record<string, unknown> | undefined) => {
      result.uniqueEntries.push({
        identifier: entry.identifier,
        consent: entry.consent,
        indexUsedForConsent: entry.indexUsedForConsent,
        status,
        indicesInPrivacyForm: privacyFormOccurrences.map(({ index }) => index),
        indicesInSurvey: surveyOccurrences.map(({ index }) => index),
        passthrough: passthrough,
      });
    };
    if (surveyOccurrences.length > 0) {
      surveyOccurrences.forEach(surveyEntry => pushToUniqueEntries(surveyEntry.passthrough));
    } else {
      pushToUniqueEntries({});
    }
  });
  // Write commented privacy form entries
  arg.privacyFormEntries.forEach((entry, index) => {
    const { status, indicesInPrivacyForm } = result.uniqueEntries.find(
      uniqueEntry => uniqueEntry.identifier === entry.identifier,
    )!;
    const lastIndex = indicesInPrivacyForm.at(-1)!;
    result.privacyFormEntries.push({
      ...entry,
      status,
      mostRecentOccurence: lastIndex === index ? 'this' : lastIndex,
    });
  });
  // Write commented survey entries
  arg.surveyEntries.forEach((entry, index) => {
    const { status, indicesInSurvey } = result.uniqueEntries.find(
      uniqueEntry => uniqueEntry.identifier === entry.identifier,
    )!;
    const lastIndex = indicesInSurvey.at(-1)!;
    result.surveyEntries.push({
      ...entry,
      status,
      mostRecentOccurence: lastIndex === index ? 'this' : lastIndex,
    });
  });
  return SInternal_JobResult.parse(result);
}
