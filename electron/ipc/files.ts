import { dialog, type IpcMain } from 'electron';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DesktopFileFilter, SaveFileRequest, SaveFileResult } from './types';

const FILE_SAVE_CHANNEL = 'file:save';

const isValidFilter = (filter: DesktopFileFilter): boolean => {
  return typeof filter.name === 'string'
    && Array.isArray(filter.extensions)
    && filter.extensions.every((extension) => typeof extension === 'string' && extension.length > 0);
};

const assertValidSaveRequest = (request: SaveFileRequest): void => {
  if (!request || typeof request.defaultName !== 'string' || request.defaultName.length === 0) {
    throw new Error('Invalid save request: defaultName is required.');
  }

  if (!Array.isArray(request.filters) || request.filters.some((filter) => !isValidFilter(filter))) {
    throw new Error('Invalid save request: filters are malformed.');
  }

  if (typeof request.contentBase64 !== 'string') {
    throw new Error('Invalid save request: content payload is malformed.');
  }
};

const sanitizeFilename = (filename: string): string => {
  const trimmed = filename.trim();
  return trimmed.length > 0 ? path.basename(trimmed) : 'export.bin';
};

export const registerFileIpc = (ipcMain: IpcMain): void => {
  ipcMain.removeHandler(FILE_SAVE_CHANNEL);

  ipcMain.handle(FILE_SAVE_CHANNEL, async (_event, request: SaveFileRequest): Promise<SaveFileResult> => {
    assertValidSaveRequest(request);

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: sanitizeFilename(request.defaultName),
      filters: request.filters,
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    await writeFile(filePath, Buffer.from(request.contentBase64, 'base64'));

    return {
      canceled: false,
      path: filePath,
    };
  });
};
