/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as z from "zod";

export const PrivacyFormEntrySchema = z.object({
  identifier: z.string(),
  consent: z.boolean(),
}).passthrough();
export type PrivacyFormEntry = z.infer<typeof PrivacyFormEntrySchema>;

export const SurveyEntrySchema = z.object({
  identifier: z.string(),
}).passthrough();
export type SurveyEntry = z.infer<typeof SurveyEntrySchema>;


const StatusSchema = z.enum([
  "OK_VALID",
  "ERROR_NO_CONSENT",
  "ERROR_ONLY_PRIVACY_FORM",
  "ERROR_ONLY_SURVEY",
  "ERROR_INVALID",
]);
export type Status = z.infer<typeof StatusSchema>;

const CommentedEntrySchema = z.object({
  status: StatusSchema, 
  mostRecentOccurence: z.union([z.literal("this"), z.number()]) 
});

const EntrySchema = z.object({
  identifier: z.string(),
  status: StatusSchema,
  indicesInPrivacyForm: z.array(z.number()),
  indicesInSurvey: z.array(z.number()),
  passthrough: z.record(z.unknown()).optional(),
});

type Entry = z.infer<typeof EntrySchema>;

type UnprocessedEntry = PrivacyFormEntry & Omit<Entry, "status">;

const JobResultStatsSchema = z.object({
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
export type JobResultStats = z.infer<typeof JobResultStatsSchema>;

const JobResultSchema = z.object({
  stats: JobResultStatsSchema,
  privacyFormEntries: z.array(PrivacyFormEntrySchema.merge(CommentedEntrySchema).passthrough()),
  surveyEntries: z.array(SurveyEntrySchema.merge(CommentedEntrySchema).passthrough()),
  uniqueEntries: z.array(EntrySchema),
});
export type JobResult = z.infer<typeof JobResultSchema>;

export const JobArgSchema = z.object({
  privacyFormEntries: z.array(PrivacyFormEntrySchema),
  surveyEntries: z.array(SurveyEntrySchema),
});
export type JobArg = z.infer<typeof JobArgSchema>;

export function executeJob(rawArg: JobArg): JobResult {
  const arg = JobArgSchema.parse(rawArg);
  const result: JobResult = {
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
  const entries = new Map<string, UnprocessedEntry>();
  arg.privacyFormEntries.forEach((newEntry, index) => {
    result.stats.totalEntries++;
    const { identifier, consent } = newEntry;
    if (!entries.has(identifier)) {
      entries.set(identifier, {
        identifier,
        consent,
        indicesInPrivacyForm: [index],
        indicesInSurvey: [],
      });
    } else {
      result.stats.totalDuplicates++;
      const existingEntry = entries.get(identifier)!;
      existingEntry.indicesInPrivacyForm.push(index);
      existingEntry.consent = newEntry.consent; // Assumption: The last entry for a study code is the most recent one and therefore reflects the participant's current consent status, so overwrite
    }
  });
  arg.surveyEntries.forEach((newEntry, index) => {
    result.stats.totalEntries++;
    const { identifier, ...passthrough } = newEntry;
    if (!entries.has(identifier)) {
      entries.set(identifier, {
        identifier,
        consent: false,
        indicesInPrivacyForm: [],
        indicesInSurvey: [index],
        passthrough,
      });
    } else {
      result.stats.totalDuplicates++;
      const existingEntry = entries.get(identifier)!;
      existingEntry.indicesInSurvey.push(index);
      existingEntry.passthrough = passthrough; // Assumption: The last entry for a study code is the most recent one, so overwrite the passthrough data
    }
  });
  result.stats.totalUniqueIdentifiers = entries.size;
  // Compute status
  entries.forEach(entry => {
    const { consent, indicesInPrivacyForm, indicesInSurvey } = entry;
    let status: Status;
    if (indicesInPrivacyForm.length > 0 && indicesInSurvey.length > 0) {
      if (consent) {
        result.stats.valid++;
        status = 'OK_VALID';
      } else {
        result.stats.noConsent++;
        status = 'ERROR_NO_CONSENT';
      }
    } else if (indicesInPrivacyForm.length > 0) {
      result.stats.onlyPrivacyForm++;
      status = 'ERROR_ONLY_PRIVACY_FORM';
    } else if (indicesInSurvey.length > 0) {
      result.stats.onlySurvey++;
      status = 'ERROR_ONLY_SURVEY';
    } else {
      result.stats.invalid++;
      status = 'ERROR_INVALID';
    }
    result.uniqueEntries.push({ ...entry, status });
  });
  // Write commented privacy form entries
  arg.privacyFormEntries.forEach((entry, index) => {
    const { status, indicesInPrivacyForm } = result.uniqueEntries.find(uniqueEntry => uniqueEntry.identifier === entry.identifier)!;
    const lastIndex = indicesInPrivacyForm.at(-1)!;
    result.privacyFormEntries.push({ ...entry, status, mostRecentOccurence: lastIndex === index ? 'this' : lastIndex });
  });
  // Write commented survey entries
  arg.surveyEntries.forEach((entry, index) => {
    const { status, indicesInSurvey } = result.uniqueEntries.find(uniqueEntry => uniqueEntry.identifier === entry.identifier)!;
    const lastIndex = indicesInSurvey.at(-1)!;
    result.surveyEntries.push({ ...entry, status, mostRecentOccurence: lastIndex === index ? 'this' : lastIndex });
  });
  return JobResultSchema.parse(result);
}