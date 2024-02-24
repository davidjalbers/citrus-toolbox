import { JobResultStats } from './lib/business-logic/core';
import { IOSelection, Headers } from './lib/schemas';
import { SelectPathArg, ValidatePathArg } from './main';

declare global {
  interface ImportMeta {
    env: {
      VITE_DEFAULT_PRIVACY_FORM_FILE_PATH?: string;
      VITE_DEFAULT_SURVEY_FILE_PATH?: string;
      VITE_DEFAULT_OUTPUT_DIR_PATH?: string;
    };
  }

  const electron: {
    selectPath: (arg?: SelectPathArg) => Promise<string | null>;
    validatePath: (arg: ValidatePathArg) => Promise<boolean>;
    processInputSelection: (arg: IOSelection) => Promise<Headers>;
    processColumnDefinitionAndRunJob: (arg: IOSelection & ColumnDefinition) => Promise<JobResultStats>;
    openExternal: (url: string) => Promise<void>;
  };
}
