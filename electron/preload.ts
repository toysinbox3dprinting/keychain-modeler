import { contextBridge, ipcRenderer } from 'electron';
import type { AppInfoResult, SaveFileRequest, SaveFileResult } from './ipc/types';

const desktopBridge = {
  saveFile: (request: SaveFileRequest): Promise<SaveFileResult> => ipcRenderer.invoke('file:save', request),
  getAppInfo: (): Promise<AppInfoResult> => ipcRenderer.invoke('app:info'),
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
