import * as z from 'zod';

const filePath = z.string()
  .trim()
  .min(1, 'This field is required.')
  .refine((value) => electron.validatePath({ path: value }), 'This file either does not exist or is not readable.');
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