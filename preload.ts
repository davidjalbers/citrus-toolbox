// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { SelectPathArg, ValidatePathArg } from '@/main';
import { IOSelection } from './components/ps-matcher/IOSelectionForm';
import { HeaderSelection } from './components/ps-matcher/HeaderSelectionForm';

contextBridge.exposeInMainWorld('electron', {
  selectPath: (arg: SelectPathArg) => ipcRenderer.invoke('select-path', arg),
  validatePath: (arg: ValidatePathArg) => ipcRenderer.invoke('validate-path', arg),
  processInputSelection: (arg: IOSelection) => ipcRenderer.invoke('process-input-selection', arg),
  processColumnDefinitionAndRunJob: (arg: IOSelection & HeaderSelection) =>
    ipcRenderer.invoke('process-column-definition-and-run-job', arg),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});
