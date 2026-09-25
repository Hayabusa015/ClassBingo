export {};

declare global {
  interface Window {
    /** Present only inside the Electron desktop build (electron/preload.cjs). */
    classbingoDesktop?: {
      isDesktop: true;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<{ ok: boolean; reason?: string }>;
    };
  }
}
