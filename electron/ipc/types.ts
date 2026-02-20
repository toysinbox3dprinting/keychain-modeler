export interface DesktopFileFilter {
  name: string;
  extensions: string[];
}

export interface SaveFileRequest {
  defaultName: string;
  filters: DesktopFileFilter[];
  contentBase64: string;
}

export interface SaveFileResult {
  canceled: boolean;
  path?: string;
}

export interface AppInfoResult {
  version: string;
  platform: string;
}
