// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { SelectPathArg, ValidatePathArg } from '@/main';
import { JobInfo } from '@/lib/schemas';

contextBridge.exposeInMainWorld('electron', {
  selectPath: (arg: SelectPathArg) => ipcRenderer.invoke('select-path', arg),
  validatePath: (arg: ValidatePathArg) => ipcRenderer.invoke('validate-path', arg),
  runJob: (arg: JobInfo) => ipcRenderer.invoke('run-job', arg),
})
