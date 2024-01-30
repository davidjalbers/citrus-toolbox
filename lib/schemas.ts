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

export const IOSelectionSchema = z.object({
  separator: z.string()/*z.enum([';', ','])*/,
  privacyFormFilePath: filePath,
  surveyFilePath: filePath,
  outputDirectoryPath: directoryPath,
});
export type IOSelection = z.infer<typeof IOSelectionSchema>;

export const HeadersSchema = z.object({
  privacyFormFileHeaders: z.array(z.string()),
  surveyFileHeaders: z.array(z.string()),
});
export type Headers = z.infer<typeof HeadersSchema>;

export const HeaderSelectionSchema = z.object({
  privacyFormIdentifierHeader: z.string(),
  privacyFormConsentHeader: z.string(),
  surveyIdentifierHeader: z.string(),
});
export type HeaderSelection = z.infer<typeof HeaderSelectionSchema>;

// export const StudyCodeSchema = z.string().regex(/^[A-Z]{4}[0-9]{2}$/);
// export type StudyCode = z.infer<typeof StudyCodeSchema>;
