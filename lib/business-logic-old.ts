import * as fs from 'fs';
import * as csv from 'fast-csv';
import { PrivacyFormEntry, PrivacyFormEntrySchema, SurveyEntry, SurveyEntrySchema, StudyCode } from "@/lib/schemas";

/**
 * This function reads the privacy form CSV file from a specified path and filters out participants who did not consent to the study.
 * These participants are then returned as an array of study codes.
 * The function also writes a commented version of the privacy form CSV file to another specified path.
 * 
 * Also filters out invalid entries (e.g. duplicate codes or unexpected data formats) and writes them to the commented version.
 * 
 * @param privacyFormFilePath path to the privacy form CSV file exported the survey application
 * @param commentedPrivacyFormFilePath path specifying where to write the commented version of the privacy form CSV file
 * @returns array of valid study codes of participants who consented to the study
 */
export async function getConsentedParticipants(privacyFormFilePath: string, commentedPrivacyFormFilePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const consentedParticipants: StudyCode[] = [];
    const pastCodes: StudyCode[] = [];

    const wsCommentedPrivacyForm = fs.createWriteStream(commentedPrivacyFormFilePath);
    const csvCommentedPrivacyForm = csv.format({ headers: true })
    csvCommentedPrivacyForm.pipe(wsCommentedPrivacyForm);

    fs.createReadStream(privacyFormFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => reject(error))
      .on('data', row => {
        const parseResult = PrivacyFormEntrySchema.safeParse(row);
        if (!parseResult.success) {
          csvCommentedPrivacyForm.write({ ...row, Comment: 'ERROR - Invalid data format' });
          return;
        }
        const entry: PrivacyFormEntry = parseResult.data;
        const { studyCode, consent } = entry;
        if (pastCodes.includes(studyCode)) {
          csvCommentedPrivacyForm.write({ ...entry, Comment: 'ERROR - Duplicate code' });
          return;
        }
        pastCodes.push(studyCode);
        if (consent !== 'JA, ich willige ein') {
          csvCommentedPrivacyForm.write({ ...entry, Comment: 'ERROR - No consent' });
          return;
        }
        consentedParticipants.push(studyCode);
        csvCommentedPrivacyForm.write({ ...entry, Comment: 'OK' });
      })
      .on('end', (rowCount: number) => {
        console.log(`Parsed privacy form file (with ${rowCount} data rows) at: `, privacyFormFilePath);
        csvCommentedPrivacyForm.end();
        console.log(`Commented version (with ${consentedParticipants.length} valid consenting entries out of ${rowCount} data rows total) created at: `, commentedPrivacyFormFilePath);
        resolve(consentedParticipants);
      });
  });
}

/**
 * This functions takes in an array of valid study codes of participants who consented to the study
 * and using these codes filters out invalid entries from a survey file at a specified path.
 * The function also writes a commented version of the survey CSV file to another specified path.
 * 
 * Also filters out invalid entries (e.g. duplicate codes or unexpected data formats) and writes them to the commented version.
 * 
 * @param surveyFilePath path to the survey CSV file exported from the survey application
 * @param commentedSurveyFilePath path specifying where to write the commented version of the survey CSV file
 * @param filteredSurveyFilePath path specifying where to write the filtered version of the survey CSV file
 * @param consentedParticipants array of study codes representing participants who consented to the study
 */
export async function filterSurveyEntries(surveyFilePath: string, commentedSurveyFilePath: string, filteredSurveyFilePath: string, consentedParticipants: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const pastCodes: StudyCode[] = [];
    let validEntries = 0;

    const wsCommentedSurvey = fs.createWriteStream(commentedSurveyFilePath);
    const csvCommentedSurvey = csv.format({ headers: true })
    csvCommentedSurvey.pipe(wsCommentedSurvey);

    const wsFilteredSurvey = fs.createWriteStream(filteredSurveyFilePath);
    const csvFilteredSurvey = csv.format({ headers: true })
    csvFilteredSurvey.pipe(wsFilteredSurvey);

    fs.createReadStream(surveyFilePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => reject(error))
      .on('data', row => {
        const parseResult = SurveyEntrySchema.safeParse(row);
        if (!parseResult.success) {
          csvCommentedSurvey.write({ ...row, Comment: 'ERROR - Invalid data format' });
          return;
        }
        const entry: SurveyEntry = parseResult.data;
        const { studyCode } = entry;
        if (pastCodes.includes(studyCode)) {
          csvCommentedSurvey.write({ ...entry, Comment: 'ERROR - Duplicate code' });
          return;
        }
        pastCodes.push(studyCode);
        if (!consentedParticipants.includes(studyCode)) {
          csvCommentedSurvey.write({ ...entry, Comment: 'ERROR - No consent' });
          return;
        }
        csvCommentedSurvey.write({ ...entry, Comment: 'OK' });
        csvFilteredSurvey.write(entry);
        ++validEntries;
      })
      .on('end', (rowCount: number) => {
        console.log(`Parsed survey file (with ${rowCount} data rows) at: `, surveyFilePath);
        csvCommentedSurvey.end();
        csvFilteredSurvey.end();
        console.log(`Commented version (with ${validEntries} valid entries out of ${rowCount} data rows total) created at: `, commentedSurveyFilePath);
        console.log(`Filtered version (with ${validEntries} valid entries) created at: `, filteredSurveyFilePath);
        resolve();
      });
  });
}
