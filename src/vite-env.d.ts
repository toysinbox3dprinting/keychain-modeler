/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_BASE_PATH?: string;
  readonly REACT_APP_BASE_PATH?: string;
  readonly REACT_APP_ENABLE_BASE_PATH_IN_DEV?: string;
  readonly REACT_APP_API_BASE_URL?: string;
  readonly REACT_APP_WS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  desktop?: {
    saveFile(request: {
      defaultName: string;
      filters: Array<{ name: string; extensions: string[] }>;
      contentBase64: string;
    }): Promise<{ canceled: boolean; path?: string }>;
    getAppInfo(): Promise<{ version: string; platform: string }>;
  };
}
