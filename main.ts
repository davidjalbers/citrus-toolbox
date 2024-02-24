import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import * as fs from 'fs/promises';

import { processColumnDefinitionAndRunJobImpl, processInputSelectionImpl } from '@/lib/business-logic';
import { IOSelection } from './components/ps-matcher/IOSelectionForm';
import { HeaderSelection } from './components/ps-matcher/HeaderSelectionForm';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

//Menu.setApplicationMenu(null);

app.on('ready', () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    minWidth: 640,
    minHeight: 980,
    width: 720,
    height: 1080,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
});

export type SelectPathArg = {
  type?: 'file' | 'directory';
};
ipcMain.handle('select-path', async (event, arg: SelectPathArg = {}) => {
  const { type = 'file' } = arg;
  const result = await dialog.showOpenDialog({
    properties: type === 'file' ? ['openFile'] : ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) return result.filePaths[0];
  return null;
});

export type ValidatePathArg = {
  type?: 'file' | 'directory';
  access?: 'read' | 'readWrite';
  path: string;
};
ipcMain.handle('validate-path', async (event, arg: ValidatePathArg) => {
  const { type = 'file', access = 'read', path } = arg;
  const constants = access === 'read' ? fs.constants.R_OK : fs.constants.R_OK | fs.constants.W_OK;
  try {
    await fs.access(path, constants);
    const stat = await fs.stat(path);
    if (type === 'file' && !stat.isFile()) {
      return false;
    } else if (type === 'directory' && !stat.isDirectory()) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('process-input-selection', (event, arg: IOSelection) => processInputSelectionImpl(arg));
ipcMain.handle('process-column-definition-and-run-job', (event, arg: IOSelection & HeaderSelection) =>
  processColumnDefinitionAndRunJobImpl(arg),
);

ipcMain.handle('open-external', (event, url: string) => {
  shell.openExternal(url);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
/*app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});*/

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
