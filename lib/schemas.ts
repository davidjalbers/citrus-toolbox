import * as z from 'zod';

export const HeadersSchema = z.object({
  privacyFormFileHeaders: z.array(z.string()),
  surveyFileHeaders: z.array(z.string()),
});
export type Headers = z.infer<typeof HeadersSchema>;

// export const StudyCodeSchema = z.string().regex(/^[A-Z]{4}[0-9]{2}$/);
// export type StudyCode = z.infer<typeof StudyCodeSchema>;
