import * as z from 'zod';

const filePath = z.string()
  .trim()
  .min(1, 'This field is required.')
  .refine((value) => electron.validatePath({ path: value }), 'This file either does not exist or is not readable.')
  .refine((value) => value.endsWith('.csv'), 'Only CSV files are supported.' )
const directoryPath = z.string()
  .trim()
  .min(1, 'This field is required.')
  .refine((value) => electron.validatePath({ path: value, type: 'directory', access: 'readWrite' }), 'This directory either does not exist or is not writable.');

export const JobInfoSchema = z.object({
  privacyFormFilePath: filePath,
  surveyFilePath: filePath,
  outputDirectoryPath: directoryPath,
});
export type JobInfo = z.infer<typeof JobInfoSchema>;

export const JobResultSchema = z.object({
  timestamp: z.string(),
  totalStudyCodes: z.number(),
  totalEntries: z.number(),
  totalDuplicates: z.number(),
  valid: z.number(),
  noConsent: z.number(),
  onlyPrivacyForm: z.number(),
  onlySurvey: z.number(),
  invalid: z.number(),
  privacyFormFileName: z.string(),
  surveyFileName: z.string(),
  outputDirectoryName: z.string(),
});
export type JobResult = z.infer<typeof JobResultSchema>;

export const StudyCodeSchema = z.string().regex(/^[A-Z]{4}[0-9]{2}$/);
export type StudyCode = z.infer<typeof StudyCodeSchema>;

const index = z.string().transform((value) => parseInt(value));

export const PrivacyFormEntrySchema = z.object({
  index,
  studyCode: StudyCodeSchema,
  consent: z.union([z.literal('JA, ich willige ein'), z.literal('Nein, ich willige nicht ein')]),
});
export type PrivacyFormEntry = z.infer<typeof PrivacyFormEntrySchema>;

export const SurveyEntrySchema = z.object({
  index,
  studyCode: StudyCodeSchema,
}).passthrough();
export type SurveyEntry = z.infer<typeof SurveyEntrySchema>;

const status = z.union([z.literal('okValid'), z.literal('errorNoConsent'), z.literal('errorOnlyPrivacyForm'), z.literal('errorOnlySurvey'), z.literal('INVALID')]);

export const AllStudyCodesOutputFileEntrySchema = z.object({
  studyCode: StudyCodeSchema,
  status,
  indexVisualization: z.union([z.literal('P'), z.literal('S'), z.literal('P+S'), z.literal('INVALID')]),
  indicesInPrivacyForm: z.array(z.number()),
  indicesInSurvey: z.array(z.number()),
  numberOfDuplicatesInPrivacyForm: z.number(),
  numberOfDuplicatesInSurvey: z.number(),
});
export type AllStudyCodesOutputFileEntry = z.infer<typeof AllStudyCodesOutputFileEntrySchema>;

export const ValidStudyCodesOutputFileEntrySchema = AllStudyCodesOutputFileEntrySchema.omit({ 
  status: true,
  indexVisualization: true,
});
export type ValidStudyCodesOutputFileEntry = z.infer<typeof ValidStudyCodesOutputFileEntrySchema>;

export const StudyCodeResultSchema = z.object({
  status,
  consent: z.boolean(),
  indicesInPrivacyForm: z.array(z.number()),
  indicesInSurvey: z.array(z.number()),
  passthrough: z.object({}).passthrough(),
});
export type StudyCodeResult = z.infer<typeof StudyCodeResultSchema>;
