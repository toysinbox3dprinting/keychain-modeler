import { app, type IpcMain } from 'electron';
import type { AppInfoResult } from './types';

const APP_INFO_CHANNEL = 'app:info';

export const registerAppIpc = (ipcMain: IpcMain): void => {
  ipcMain.removeHandler(APP_INFO_CHANNEL);

  ipcMain.handle(APP_INFO_CHANNEL, async (): Promise<AppInfoResult> => {
    return {
      version: app.getVersion(),
      platform: process.platform,
    };
  });
};
