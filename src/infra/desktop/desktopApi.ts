import type { AppInfoResult, DesktopFileFilter, SaveFileResult } from './types';

const isDesktopBridgeAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.desktop;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

const contentToBase64 = async (content: string | File): Promise<string> => {
  if (typeof content === 'string') {
    return toBase64(new TextEncoder().encode(content));
  }

  const buffer = await content.arrayBuffer();
  return toBase64(new Uint8Array(buffer));
};

const getFiltersFromFilename = (filename: string): DesktopFileFilter[] => {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'obj':
      return [{ name: 'OBJ Model', extensions: ['obj'] }];
    case 'stl':
      return [{ name: 'STL Model', extensions: ['stl'] }];
    case 'x3g':
      return [{ name: 'X3G File', extensions: ['x3g'] }];
    default:
      return [{ name: 'All Files', extensions: ['*'] }];
  }
};

export const saveFileWithDesktop = async (
  filename: string,
  content: string | File,
): Promise<SaveFileResult | undefined> => {
  if (!isDesktopBridgeAvailable()) {
    return undefined;
  }

  try {
    const contentBase64 = await contentToBase64(content);
    return await window.desktop?.saveFile({
      defaultName: filename,
      filters: getFiltersFromFilename(filename),
      contentBase64,
    });
  } catch (error) {
    console.warn('Desktop save failed, falling back to browser download.', error);
    return undefined;
  }
};

export const getDesktopAppInfo = async (): Promise<AppInfoResult | undefined> => {
  if (!isDesktopBridgeAvailable()) {
    return undefined;
  }

  return window.desktop?.getAppInfo();
};
