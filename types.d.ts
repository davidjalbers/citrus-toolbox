import { SelectPathArg, ValidatePathArg } from "./main";

declare global {

  // This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
  // plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
  // whether you're running in development or production).
  declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
  declare const MAIN_WINDOW_VITE_NAME: string;
  
  interface ImportMeta {
    env: {
      VITE_DEFAULT_PRIVACY_FORM_FILE_PATH?: string;
      VITE_DEFAULT_SURVEY_FILE_PATH?: string;
      VITE_DEFAULT_OUTPUT_DIR_PATH?: string;
    };
  }

  const electron: {
    selectPath: (arg?: SelectPathArg) => Promise<string|null>;
    validatePath: (arg: ValidatePathArg) => Promise<boolean>;
    runJob: (arg: JobInfo) => Promise<JobResult>;
  }

}